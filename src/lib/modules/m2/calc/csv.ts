// Đọc file dữ liệu xuất từ thiết bị (CSV / TXT) – M2.4. Tự nhận dấu phân cách ; , tab |.

export type Table = { headers: string[]; rows: string[][]; delimiter: string };

const DELIMS = [";", "\t", ",", "|"];

/** Tách 1 dòng CSV, hỗ trợ ô trong "…" có chứa dấu phân cách. */
function splitLine(line: string, d: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (c === d && !q) { out.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

export function parseTable(text: string): Table {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (!lines.length) throw new Error("File trống");
  // Chọn dấu phân cách cho số cột ổn định nhất trên các dòng đầu
  const sample = lines.slice(0, 20);
  const score = (d: string) => {
    const counts = sample.map((l) => splitLine(l, d).length);
    const mode = counts.sort((a, b) => counts.filter((x) => x === b).length - counts.filter((x) => x === a).length)[0];
    return mode > 1 ? counts.filter((c) => c === mode).length * mode : 0;
  };
  const delimiter = [...DELIMS].sort((a, b) => score(b) - score(a))[0];
  const parsed = lines.map((l) => splitLine(l, delimiter));
  const width = Math.max(...parsed.map((r) => r.length));
  const first = parsed[0];
  // Dòng đầu là tiêu đề khi không có ô số nào (dòng dữ liệu luôn có ít nhất 1 số).
  const hasHeader = first.some((c) => c !== "") && !first.some((c) => Number.isFinite(toNumber(c)));
  const headers = hasHeader ? first.concat(Array(Math.max(0, width - first.length)).fill("")).map((h, i) => h || `Cột ${i + 1}`) : Array.from({ length: width }, (_, i) => `Cột ${i + 1}`);
  return { headers, rows: hasHeader ? parsed.slice(1) : parsed, delimiter };
}

/** "0,532" | "0.532" | "1 234,5" | "1,234.5" → số; NaN nếu không đọc được. */
export function toNumber(s: string): number {
  let t = (s ?? "").trim().replace(/\s/g, "");
  if (!t) return NaN;
  if (t.includes(",") && t.includes(".")) {
    // dấu nào đứng sau cùng là dấu thập phân
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else t = t.replace(",", ".");
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? Number(t) : NaN;
}

/**
 * Cột số đo mặc định: cột số ngoài cùng bên phải có giá trị thập phân (file thiết bị thường để
 * giá trị đo ở cuối; cột STT / "Lần" là số nguyên). Không có thì lấy cột số cuối cùng; -1 nếu không có.
 */
export function defaultValueColumn(t: Table): number {
  const numeric = t.headers.map((_, i) => i).filter((i) => columnValues(t, i).length > 0);
  const decimal = numeric.filter((i) => columnValues(t, i).some((v) => !Number.isInteger(v)));
  return (decimal.length ? decimal : numeric).at(-1) ?? -1;
}

/** Lấy các giá trị số của 1 cột, có thể lọc theo giá trị một cột khác (VD mã mẫu). */
export function columnValues(t: Table, col: number, filter?: { col: number; equals: string }) {
  return t.rows
    .filter((r) => !filter || (r[filter.col] ?? "").trim() === filter.equals.trim())
    .map((r) => toNumber(r[col] ?? ""))
    .filter((v) => Number.isFinite(v));
}
