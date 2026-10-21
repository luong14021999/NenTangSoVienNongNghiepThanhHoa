// Tỷ lệ dùng chung cho M3 (hàm thuần, kiểm thử được).

/** Tỷ lệ phần trăm a/b, 1 chữ số thập phân; b ≤ 0 → null (chưa có dữ liệu). */
export const pct = (a: number, b: number) => {
  const d = Number(b) || 0;
  return d > 0 ? Math.round(((Number(a) || 0) / d) * 1000) / 10 : null;
};

/** Tỷ lệ nhiễm của mẻ cấy (%). */
export const contaminationRate = (b: { contaminated: number; vessels: number }) => pct(b.contaminated, b.vessels);

/** Tỷ lệ sống sau ra ngôi (%). */
export const survivalRate = (l: { survived: number; quantity: number }) => pct(l.survived, l.quantity);

export const fmtPct = (v: number | null) => (v == null ? "—" : `${v.toLocaleString("vi-VN")}%`);
