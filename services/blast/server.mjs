// Dịch vụ BLAST+ nội bộ (M3.2.4) – Viện Nông nghiệp tỉnh Thanh Hóa.
// Chạy trên máy chủ của Viện (hoặc Trung tâm dữ liệu tỉnh). Trình tự ADN/ARN/protein CHỈ lưu trên đĩa máy này;
// nền tảng web chỉ nhận thông tin mô tả và bảng kết quả đối soát. Không gửi dữ liệu tới BLAST công cộng (NĐ 59/2017/NĐ-CP).
//
// Biến môi trường: BLAST_TOKEN (bắt buộc, ≥ 24 ký tự), PORT (mặc định 8088), DATA_DIR (mặc định ./data).
// Không phụ thuộc thư viện ngoài; cần ncbi-blast+ (makeblastdb, blastn, blastp) trong PATH.
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const TOKEN = process.env.BLAST_TOKEN ?? "";
const PORT = Number(process.env.PORT ?? 8088);
const DATA = process.env.DATA_DIR ?? join(process.cwd(), "data");
const MAX_BODY = 2 * 1024 * 1024; // 2 MB
const MAX_SEQ = 1_000_000;
const MAX_PARALLEL = 2;


// ── Kiểm tra dữ liệu (thuần, xuất ra để kiểm thử) ───────────────────

const NUCL = /^[ACGTURYKMSWBDHVN-]+$/;
const PROT = /^[ACDEFGHIKLMNPQRSTVWYBJZXU*-]+$/;
export const ACCESSION = /^[A-Za-z0-9._-]{1,64}$/;

/** Bỏ dòng tiêu đề FASTA, khoảng trắng, số; viết hoa. */
export function cleanSequence(raw) {
  return String(raw ?? "")
    .split(/\r?\n/)
    .filter((l) => !l.startsWith(">"))
    .join("")
    .replace(/[\s0-9]/g, "")
    .toUpperCase();
}

export function validateSequence(raw, molecule) {
  const seq = cleanSequence(raw);
  if (!seq) return { error: "Trình tự trống" };
  if (seq.length > MAX_SEQ) return { error: `Trình tự dài quá ${MAX_SEQ} ký tự` };
  const isProt = molecule === "Protein";
  if (!(isProt ? PROT : NUCL).test(seq)) return { error: `Trình tự có ký tự không hợp lệ cho ${isProt ? "protein" : "axit nucleic"} (chỉ nhận ký hiệu IUPAC)` };
  // ARN lưu chung CSDL nucleotide: U → T.
  return { seq: isProt ? seq : seq.replace(/U/g, "T") };
}

const COLS = ["sseqid", "pident", "length", "mismatch", "gapopen", "qstart", "qend", "sstart", "send", "evalue", "bitscore", "qcovs"];

/** Đọc kết quả -outfmt 6 (các cột COLS) → mảng hit. */
export function parseOutfmt6(text) {
  return String(text)
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const c = l.split("\t");
      return {
        accession: c[0],
        identity: Number(c[1]),
        length: Number(c[2]),
        mismatches: Number(c[3]),
        gaps: Number(c[4]),
        qStart: Number(c[5]),
        qEnd: Number(c[6]),
        sStart: Number(c[7]),
        sEnd: Number(c[8]),
        evalue: Number(c[9]),
        bitscore: Number(c[10]),
        queryCoverage: Number(c[11]),
      };
    });
}

// ── Kho trình tự trên đĩa ──────────────────────────────────────────

const metaFile = join(DATA, "sequences.json");
const fastaFile = (kind) => join(DATA, `${kind}.fasta`);
const dbPath = (kind) => join(DATA, `db_${kind}`);

async function loadMeta() {
  try {
    return JSON.parse(await readFile(metaFile, "utf8"));
  } catch {
    return {};
  }
}

const run = (cmd, args, timeout = 120_000) =>
  new Promise((resolve, reject) =>
    execFile(cmd, args, { timeout, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve(stdout))),
  );

/** Ghi lại FASTA và dựng lại CSDL BLAST cho loại (nucl / prot). Ghi file tạm rồi đổi tên để không hỏng khi lỗi giữa chừng. */
async function rebuild(meta, kind) {
  const entries = Object.values(meta).filter((m) => m.kind === kind);
  const fasta = entries.map((m) => `>${m.accession}\n${m.seq.match(/.{1,80}/g).join("\n")}`).join("\n") + "\n";
  await writeFile(`${fastaFile(kind)}.tmp`, fasta);
  await rename(`${fastaFile(kind)}.tmp`, fastaFile(kind));
  if (entries.length) await run("makeblastdb", ["-in", fastaFile(kind), "-dbtype", kind, "-out", dbPath(kind), "-parse_seqids"]);
}

async function saveMeta(meta) {
  await writeFile(`${metaFile}.tmp`, JSON.stringify(meta));
  await rename(`${metaFile}.tmp`, metaFile);
}

// Hàng đợi ghi đơn giản: mọi thay đổi kho trình tự chạy tuần tự.
let writeChain = Promise.resolve();
const serialWrite = (fn) => (writeChain = writeChain.then(fn, fn));
let running = 0;

// ── HTTP ────────────────────────────────────────────────────────────

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

function authorized(req) {
  const h = req.headers.authorization ?? "";
  const got = Buffer.from(h.startsWith("Bearer ") ? h.slice(7) : "");
  const want = Buffer.from(TOKEN);
  return got.length === want.length && timingSafeEqual(got, want);
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw Object.assign(new Error("Dữ liệu quá lớn (tối đa 2 MB)"), { status: 413 });
    chunks.push(c);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw Object.assign(new Error("Body phải là JSON"), { status: 400 });
  }
}

async function handle(req, res) {
  const url = new URL(req.url, "http://local");
  if (req.method === "GET" && url.pathname === "/health") {
    const meta = await loadMeta();
    const version = await run("blastn", ["-version"], 10_000).then((v) => v.split("\n")[0]).catch(() => "không tìm thấy blastn");
    const all = Object.values(meta);
    return json(res, 200, { ok: true, blast: version, nucl: all.filter((m) => m.kind === "nucl").length, prot: all.filter((m) => m.kind === "prot").length });
  }
  if (!authorized(req)) return json(res, 401, { error: "Sai hoặc thiếu token" });

  if (req.method === "GET" && url.pathname === "/sequences") {
    const meta = await loadMeta();
    return json(res, 200, { items: Object.values(meta).map(({ seq, ...m }) => ({ ...m, length: seq.length })) });
  }

  if (req.method === "POST" && url.pathname === "/sequences") {
    const b = await readBody(req);
    if (!ACCESSION.test(b.accession ?? "")) return json(res, 400, { error: "Mã trình tự chỉ gồm chữ, số, . _ - (tối đa 64 ký tự)" });
    const molecule = ["ADN", "ARN", "Protein"].includes(b.molecule) ? b.molecule : "ADN";
    const v = validateSequence(b.sequence, molecule);
    if (v.error) return json(res, 400, { error: v.error });
    const kind = molecule === "Protein" ? "prot" : "nucl";
    const sha256 = createHash("sha256").update(v.seq).digest("hex");
    await serialWrite(async () => {
      const meta = await loadMeta();
      const prevKind = meta[b.accession]?.kind;
      meta[b.accession] = { accession: b.accession, molecule, kind, seq: v.seq, sha256, updatedAt: new Date().toISOString() };
      await rebuild(meta, kind);
      if (prevKind && prevKind !== kind) await rebuild(meta, prevKind);
      await saveMeta(meta);
    });
    return json(res, 201, { accession: b.accession, molecule, length: v.seq.length, sha256 });
  }

  const del = url.pathname.match(/^\/sequences\/([^/]+)$/);
  if (req.method === "DELETE" && del) {
    const acc = decodeURIComponent(del[1]);
    let found = false;
    await serialWrite(async () => {
      const meta = await loadMeta();
      const kind = meta[acc]?.kind;
      if (!kind) return;
      found = true;
      delete meta[acc];
      await rebuild(meta, kind);
      await saveMeta(meta);
    });
    return found ? json(res, 200, { ok: true }) : json(res, 404, { error: "Không có trình tự này" });
  }

  if (req.method === "POST" && url.pathname === "/search") {
    if (running >= MAX_PARALLEL) return json(res, 429, { error: "Máy chủ đang bận, thử lại sau ít phút" });
    const b = await readBody(req);
    const program = b.program === "blastp" ? "blastp" : "blastn";
    const v = validateSequence(b.query, program === "blastp" ? "Protein" : "ADN");
    if (v.error) return json(res, 400, { error: v.error });
    const kind = program === "blastp" ? "prot" : "nucl";
    const meta = await loadMeta();
    if (!Object.values(meta).some((m) => m.kind === kind)) return json(res, 200, { program, queryLength: v.seq.length, hits: [] });
    const evalue = Math.min(10, Math.max(1e-200, Number(b.evalue) || 1e-5));
    const maxHits = Math.min(100, Math.max(1, Math.round(Number(b.maxHits) || 20)));
    const qfile = join(tmpdir(), `q_${randomUUID()}.fa`);
    running++;
    try {
      await writeFile(qfile, `>query\n${v.seq}\n`);
      const out = await run(program, ["-query", qfile, "-db", dbPath(kind), "-outfmt", `6 ${COLS.join(" ")}`, "-evalue", String(evalue), "-max_target_seqs", String(maxHits)]);
      return json(res, 200, { program, queryLength: v.seq.length, querySha256: createHash("sha256").update(v.seq).digest("hex"), hits: parseOutfmt6(out) });
    } finally {
      running--;
      await rm(qfile, { force: true });
    }
  }

  return json(res, 404, { error: "Không có đường dẫn này" });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (TOKEN.length < 24) {
    console.error("BLAST_TOKEN phải có ít nhất 24 ký tự");
    process.exit(1);
  }
  await mkdir(DATA, { recursive: true });
  createServer((req, res) =>
    handle(req, res).catch((e) => {
      console.error(e);
      json(res, e.status ?? 500, { error: e.status ? e.message : "Lỗi máy chủ BLAST" });
    }),
  ).listen(PORT, () => console.log(`Dịch vụ BLAST+ nội bộ chạy cổng ${PORT}, dữ liệu tại ${DATA}`));
}
