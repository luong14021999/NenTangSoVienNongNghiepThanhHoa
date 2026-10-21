// M3.2 đợt D – quy tắc thuần: chỉ thị phân tử (nhận dạng giống, giám định độ thuần), đọc kiểu gen, danh mục.
// Kiểm thử được.

export const MOLECULES = ["ADN", "ARN", "Protein"] as const;
export const MARKER_KINDS = ["SSR", "SNP", "Mã vạch ADN"] as const;
export const SAMPLE_PURPOSES = ["Giống tham chiếu", "Mẫu cần nhận dạng", "Cây kiểm tra độ thuần"] as const;
export const FACILITY_KINDS = ["Của Viện", "Liên kết"] as const;
export const INSPECTION_RESULTS = ["Chưa kiểm tra", "Đạt", "Không đạt"] as const;
export const FACILITY_STATUSES = ["Đang hoạt động", "Tạm dừng", "Ngừng liên kết"] as const;
export const POST_KINDS = ["Thông tin thị trường", "Mô hình hiệu quả", "Tiến bộ kỹ thuật", "Nguồn giống", "Hỗ trợ sau cung ứng"] as const;

/** Kiểu gen 1 chỉ thị: cặp alen không thứ tự; alen 2 trống = đồng hợp. */
export type Genotype = [string, string];

export function genotypeOf(allele1: string, allele2?: string | null): Genotype {
  const a = String(allele1 ?? "").trim().toUpperCase();
  const b = String(allele2 ?? "").trim().toUpperCase() || a;
  return a <= b ? [a, b] : [b, a];
}

/** Tỷ lệ alen chung của 2 kiểu gen: 1 (giống hệt), 0,5 (chung 1 alen), 0 (khác). */
export function alleleSharing(x: Genotype, y: Genotype) {
  const rest = [...y];
  let shared = 0;
  for (const a of x) {
    const i = rest.indexOf(a);
    if (i >= 0) {
      shared++;
      rest.splice(i, 1);
    }
  }
  return shared / 2;
}

export type Profile = Map<string, Genotype>; // markerId → kiểu gen

/** So 2 hồ sơ ADN trên các chỉ thị cùng có số liệu. */
export function compareProfiles(a: Profile, b: Profile) {
  let compared = 0, identical = 0, sum = 0;
  for (const [marker, ga] of a) {
    const gb = b.get(marker);
    if (!gb) continue;
    compared++;
    const s = alleleSharing(ga, gb);
    sum += s;
    if (s === 1) identical++;
  }
  return { compared, identical, similarity: compared ? Math.round((sum / compared) * 1000) / 1000 : null };
}

export const MIN_MARKERS = 3;

/** Nhận dạng: xếp các giống tham chiếu theo độ tương đồng với mẫu. */
export function identifySample<R extends { id: string; label: string; profile: Profile }>(sample: Profile, references: R[], minMarkers = MIN_MARKERS) {
  return references
    .map((r) => {
      const c = compareProfiles(sample, r.profile);
      const conclusion =
        c.compared < minMarkers || c.similarity == null
          ? "Chưa đủ chỉ thị"
          : c.similarity === 1
            ? "Trùng khớp"
            : c.similarity >= 0.9
              ? "Rất gần (cần thêm chỉ thị)"
              : c.similarity >= 0.75
                ? "Gần giống"
                : "Khác giống";
      return { ref: r, ...c, conclusion };
    })
    .sort((x, y) => (y.similarity ?? -1) - (x.similarity ?? -1) || y.compared - x.compared);
}

/**
 * Giám định độ thuần: cây đúng giống khi khớp hoàn toàn kiểu gen giống chuẩn trên mọi chỉ thị cùng có số liệu.
 * Độ thuần (%) = cây đúng giống ÷ cây đủ số liệu (≥ minMarkers chỉ thị chung).
 */
export function purityTest<P extends { id: string; label: string; profile: Profile }>(plants: P[], reference: Profile, minMarkers = MIN_MARKERS) {
  const rows = plants.map((p) => {
    const c = compareProfiles(p.profile, reference);
    const enough = c.compared >= minMarkers;
    return { plant: p, ...c, enough, trueToType: enough && c.identical === c.compared };
  });
  const tested = rows.filter((r) => r.enough);
  const ok = tested.filter((r) => r.trueToType).length;
  return {
    rows,
    tested: tested.length,
    trueToType: ok,
    offTypes: tested.filter((r) => !r.trueToType).map((r) => r.plant),
    purity: tested.length ? Math.round((ok / tested.length) * 1000) / 10 : null,
  };
}

/** Gom kiểu gen (genotype_calls) thành hồ sơ theo mẫu. */
export function profilesBySample(calls: { sampleId: string; markerId: string; allele1: string; allele2: string }[]) {
  const m = new Map<string, Profile>();
  for (const c of calls) {
    if (!m.has(c.sampleId)) m.set(c.sampleId, new Map());
    m.get(c.sampleId)!.set(c.markerId, genotypeOf(c.allele1, c.allele2));
  }
  return m;
}

export type GenotypeRow = { sampleCode: string; markerCode: string; allele1: string; allele2: string };

/** Đọc kiểu gen dán từ Excel / CSV: Mã mẫu, Mã chỉ thị, Alen 1, Alen 2 (alen 2 trống = đồng hợp). */
export function parseGenotypeCsv(text: string, maxRows = 20_000) {
  const lines = String(text ?? "").replace(/^﻿/, "").split(/\r?\n/);
  const first = lines.find((l) => l.trim()) ?? "";
  const sep = first.includes("\t") ? "\t" : first.includes(";") ? ";" : ",";
  const rows: GenotypeRow[] = [];
  const errors: { line: number; message: string }[] = [];
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const [sampleCode = "", markerCode = "", allele1 = "", allele2 = ""] = raw.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const head = sampleCode.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    if (rows.length === 0 && errors.length === 0 && (head.startsWith("ma mau") || head === "sample")) return;
    if (!sampleCode || !markerCode) return void errors.push({ line: i + 1, message: "Thiếu mã mẫu hoặc mã chỉ thị" });
    if (!allele1) return void errors.push({ line: i + 1, message: "Thiếu alen 1" });
    if (!/^[A-Za-z0-9.+\-/]{1,20}$/.test(allele1) || (allele2 && !/^[A-Za-z0-9.+\-/]{1,20}$/.test(allele2))) return void errors.push({ line: i + 1, message: "Alen chỉ gồm chữ, số (kích thước bp hoặc nucleotide)" });
    if (rows.length >= maxRows) return void errors.push({ line: i + 1, message: `Quá ${maxRows} dòng` });
    rows.push({ sampleCode, markerCode, allele1, allele2 });
  });
  return { rows, errors };
}

/** Kiểm tra tọa độ (vùng Việt Nam mở rộng) – tránh nhập nhầm kinh độ / vĩ độ. */
export function validateCoordinates(lat: number | null, lng: number | null) {
  if (lat == null && lng == null) return null;
  if (lat == null || lng == null) return "Nhập đủ cả vĩ độ và kinh độ";
  if (!(lat >= 8 && lat <= 24 && lng >= 102 && lng <= 118)) return "Tọa độ ngoài lãnh thổ Việt Nam – kiểm tra lại (vĩ độ ~19–21, kinh độ ~104–106 ở Thanh Hóa)";
  return null;
}

/** Hồ sơ chuẩn của từng giống = gộp các mẫu "Giống tham chiếu" của giống đó (chỉ thị trùng → giữ mẫu nhập trước). */
export function referenceProfiles(
  samples: { id: string; purpose: string; varietyId: string }[],
  profiles: Map<string, Profile>,
) {
  const out = new Map<string, Profile>();
  for (const s of samples) {
    if (s.purpose !== "Giống tham chiếu" || !s.varietyId) continue;
    const p = profiles.get(s.id);
    if (!p) continue;
    const merged = out.get(s.varietyId) ?? new Map<string, Genotype>();
    for (const [m, g] of p) if (!merged.has(m)) merged.set(m, g);
    out.set(s.varietyId, merged);
  }
  return out;
}
