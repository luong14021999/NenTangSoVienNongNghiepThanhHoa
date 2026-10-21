// M3.1 đợt A – quy tắc thuần: hệ số nhân, tỷ lệ sống, thống kê nhiễm theo nhóm, truy nguyên mẻ cấy,
// ràng buộc dữ liệu, cảnh báo phòng nuôi. Kiểm thử được.
import { pct } from "@/lib/modules/m3/rates";

export const DISEASE_STATUSES = ["Chưa kiểm tra", "Sạch bệnh", "Nhiễm bệnh"] as const;
export const DISEASE_METHODS = ["ELISA", "PCR", "RT-PCR", "Quan sát triệu chứng", "Khác"] as const;
export const MOTHER_STATUSES = ["Đang sử dụng", "Tạm dừng", "Loại bỏ"] as const;
export const MEDIA_QC_RESULTS = ["Chờ kiểm tra", "Đạt", "Không đạt"] as const;
export const CHEMICAL_UNITS = ["mg", "g", "ml", "µl"] as const;
export const CABINET_STATUSES = ["Đang dùng", "Bảo trì", "Ngừng dùng"] as const;

/** Mặc định nếu Viện chưa đặt cấu hình `tissue_contamination_threshold`. */
export const DEFAULT_CONTAMINATION_THRESHOLD = 7;
/** Nhóm có ít hơn số bình này: tỷ lệ chưa đủ tin cậy để kết luận. */
export const MIN_VESSELS_FOR_CONCLUSION = 20;

/** Hệ số nhân = chồi / cây thu được ÷ mẫu đưa vào (2 chữ số thập phân); chưa đủ dữ liệu → null. */
export function multiplicationRate(b: { plantlets: number; explants: number }) {
  const e = Number(b.explants) || 0;
  return e > 0 ? Math.round(((Number(b.plantlets) || 0) / e) * 100) / 100 : null;
}

/** Tỷ lệ sống của mẻ (%) = mẫu sống ÷ mẫu đưa vào. */
export const batchSurvivalRate = (b: { survived: number; explants: number }) => pct(b.survived, b.explants);

export type ContaminationGroup = {
  key: string;
  batches: number;
  vessels: number;
  contaminated: number;
  rate: number | null;
  overThreshold: boolean;
  smallSample: boolean;
};

/**
 * Gom tỷ lệ nhiễm theo một tiêu chí (tủ cấy, người thao tác, lô môi trường, tháng…).
 * Tỷ lệ nhóm = tổng bình nhiễm ÷ tổng bình (không lấy trung bình các tỷ lệ). Sắp giảm dần theo tỷ lệ.
 */
export function contaminationBy<T extends { vessels: number; contaminated: number }>(
  batches: T[],
  key: (b: T) => string,
  threshold: number,
): ContaminationGroup[] {
  const m = new Map<string, { batches: number; vessels: number; contaminated: number }>();
  for (const b of batches) {
    const k = key(b) || "Chưa ghi";
    const cur = m.get(k) ?? { batches: 0, vessels: 0, contaminated: 0 };
    cur.batches += 1;
    cur.vessels += Number(b.vessels) || 0;
    cur.contaminated += Number(b.contaminated) || 0;
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([k, v]) => {
      const rate = pct(v.contaminated, v.vessels);
      return { key: k, ...v, rate, overThreshold: rate != null && rate > threshold, smallSample: v.vessels < MIN_VESSELS_FOR_CONCLUSION };
    })
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
}

/** Chuỗi mẻ từ mẻ hiện tại ngược về mẻ đầu tiên (mẻ khởi đầu ở cuối). Chặn vòng lặp và độ sâu bất thường. */
export function lineage<T extends { id: string; parentBatchId: string }>(id: string, batches: T[], maxDepth = 50): T[] {
  const byId = new Map(batches.map((b) => [b.id, b]));
  const chain: T[] = [];
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id) && chain.length < maxDepth) {
    chain.push(cur);
    seen.add(cur.id);
    cur = cur.parentBatchId ? byId.get(cur.parentBatchId) : undefined;
  }
  return chain;
}

/** Ràng buộc khi ghi mẻ cấy; trả lỗi tiếng Việt hoặc null. */
export function validateCultureBatch(
  b: { id?: string; parentBatchId: string; startedAt: string; vessels: number; contaminated: number; explants: number; survived: number },
  ctx: {
    mediaBatch?: { code: string; qcResult: string; expiresAt: string } | null;
    batches: { id: string; parentBatchId: string }[];
  },
) {
  if ((Number(b.contaminated) || 0) > (Number(b.vessels) || 0)) return "Số bình nhiễm không được lớn hơn số bình cấy";
  if ((Number(b.survived) || 0) > (Number(b.explants) || 0)) return "Số mẫu sống không được lớn hơn số mẫu đưa vào";
  if (ctx.mediaBatch) {
    if (ctx.mediaBatch.qcResult !== "Đạt") return `Lô môi trường ${ctx.mediaBatch.code} chưa đạt kiểm tra chất lượng (${ctx.mediaBatch.qcResult})`;
    if (ctx.mediaBatch.expiresAt && b.startedAt && b.startedAt > ctx.mediaBatch.expiresAt) return `Lô môi trường ${ctx.mediaBatch.code} đã hết hạn sử dụng trước ngày cấy`;
  }
  if (b.parentBatchId) {
    if (b.id && b.parentBatchId === b.id) return "Mẻ cha không được là chính mẻ này";
    if (b.id && lineage(b.parentBatchId, ctx.batches).some((x) => x.id === b.id)) return "Mẻ cha tạo vòng lặp truy nguyên";
  }
  return null;
}

/** Không đưa vật liệu từ cây mẹ nhiễm bệnh vào nuôi cấy. */
export function validateMaterialSource(motherPlant: { code: string; diseaseStatus: string } | null | undefined) {
  if (motherPlant?.diseaseStatus === "Nhiễm bệnh") return `Cây mẹ ${motherPlant.code} có kết quả nhiễm bệnh – không dùng làm vật liệu khởi đầu`;
  return null;
}

export function validateMediaBatch(m: { phMeasured: number; autoclaveTempC: number; autoclaveMinutes: number; qcResult: string }) {
  if (m.phMeasured && (m.phMeasured < 3 || m.phMeasured > 9)) return "pH đo được phải trong khoảng 3–9";
  if (m.qcResult === "Đạt" && !(Number(m.autoclaveTempC) > 0 && Number(m.autoclaveMinutes) > 0)) return "Lô Đạt phải ghi nhiệt độ và thời gian hấp tiệt trùng";
  return null;
}

export type RoomLimits = { tempMin: number; tempMax: number; humidityMin: number; humidityMax: number; lightMin: number; lightMax: number };
export type Reading = { temperature: number | null; humidity: number | null; light: number | null };

/** Các thông số ngoài ngưỡng của 1 lần đo. */
export function readingAlerts(room: RoomLimits, r: Reading) {
  const out: { field: "Nhiệt độ" | "Độ ẩm" | "Ánh sáng"; value: number; limit: string }[] = [];
  const check = (field: "Nhiệt độ" | "Độ ẩm" | "Ánh sáng", v: number | null, min: number, max: number, unit: string) => {
    if (v == null || !Number.isFinite(v)) return;
    if ((min && v < min) || (max && v > max)) out.push({ field, value: v, limit: `${min}–${max} ${unit}` });
  };
  check("Nhiệt độ", r.temperature, room.tempMin, room.tempMax, "°C");
  check("Độ ẩm", r.humidity, room.humidityMin, room.humidityMax, "%");
  check("Ánh sáng", r.light, room.lightMin, room.lightMax, "lux");
  return out;
}

/** Kiểm tra số liệu thiết bị gửi lên (giá trị vật lý hợp lý). */
export function validateReading(r: { temperature?: unknown; humidity?: unknown; light?: unknown; at?: unknown }) {
  const num = (v: unknown) => (v == null || v === "" ? null : Number(v));
  const t = num(r.temperature), h = num(r.humidity), l = num(r.light);
  if (t == null && h == null && l == null) return { error: "Cần ít nhất một trong temperature, humidity, light" };
  if (t != null && !(t >= -20 && t <= 60)) return { error: "temperature ngoài khoảng −20…60 °C" };
  if (h != null && !(h >= 0 && h <= 100)) return { error: "humidity ngoài khoảng 0…100 %" };
  if (l != null && !(l >= 0 && l <= 200_000)) return { error: "light ngoài khoảng 0…200000 lux" };
  let at: string | null = null;
  if (r.at != null && r.at !== "") {
    const d = new Date(String(r.at));
    if (Number.isNaN(d.getTime())) return { error: "at không phải thời điểm ISO 8601" };
    if (d.getTime() > Date.now() + 5 * 60_000) return { error: "at ở tương lai" };
    at = d.toISOString();
  }
  return { value: { temperature: t, humidity: h, light: l, at } };
}

/** Số liệu đo cũ hơn `hours` giờ (hoặc chưa có) → coi như thiết bị mất tín hiệu. `now` truyền vào để kiểm thử. */
export function isStaleReading(at: string | undefined, hours: number, now = Date.now()) {
  return !at || now - new Date(at).getTime() > hours * 3_600_000;
}
