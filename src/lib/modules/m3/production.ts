// M3.1 đợt B – quy tắc thuần: kế hoạch tính ngược theo đơn hàng, giá thành lô giống, tồn kho, tiến độ đơn hàng.
// Kiểm thử được.

export const ORDER_STATUSES = ["Mới", "Đã xác nhận", "Đang sản xuất", "Giao một phần", "Hoàn thành", "Hủy"] as const;
export const GRADE_REQUIREMENTS = ["Loại 1", "Loại 2", "Không yêu cầu"] as const;
export const SUPPLY_CATEGORIES = ["Hóa chất", "Bình – dụng cụ", "Giá thể – bầu", "Khác"] as const;
export const MOVE_KINDS = ["Nhập", "Xuất", "Kiểm kê điều chỉnh"] as const;
export const FEEDBACK_STATUSES = ["Mới", "Đang xử lý", "Đã phản hồi"] as const;
export const FEEDBACK_CHANNELS = ["Cán bộ ghi nhận", "Điện thoại", "Trang QR"] as const;

const DAY = 86_400_000;
const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString().slice(0, 10);
const frac = (pctValue: number) => Math.min(1, Math.max(0.01, (Number(pctValue) || 0) / 100));

export type Profile = {
  multiplicationRate: number;
  cycleDays: number;
  rootingDays: number;
  nurseryDays: number;
  invitroSurvival: number;
  nurserySurvival: number;
  grade1Share: number;
};

/**
 * Kế hoạch tính ngược từ ngày giao:
 * cây cần giao → cây phải ra ngôi (÷ tỷ lệ sống vườn ươm, ÷ tỷ lệ Loại 1 nếu yêu cầu Loại 1) → chồi phải đưa ra rễ
 * (÷ tỷ lệ sống in vitro) → số lần cấy chuyển cần từ số chồi hiện có → hạn chót bắt đầu từng khâu.
 */
export function planOrder(
  o: { quantity: number; dueAt: string; gradeRequired: string },
  p: Profile,
  opts: { stockShoots: number; today: string },
) {
  const q = Math.max(0, Math.round(Number(o.quantity) || 0));
  const sellable = o.gradeRequired === "Loại 1" ? Math.ceil(q / frac(p.grade1Share)) : q;
  const toAcclimatize = Math.ceil(sellable / frac(p.nurserySurvival));
  const toRoot = Math.ceil(toAcclimatize / frac(p.invitroSurvival));
  const stock = Math.max(1, Math.round(Number(opts.stockShoots) || 0));
  const rate = Math.max(1.01, Number(p.multiplicationRate) || 1.01);
  const cycles = toRoot <= stock ? 0 : Math.ceil(Math.log(toRoot / stock) / Math.log(rate));
  if (!o.dueAt) return { sellable, toAcclimatize, toRoot, cycles, dates: null, slackDays: null, feasible: null };
  const acclimatizeBy = addDays(o.dueAt, -(Number(p.nurseryDays) || 0));
  const rootingBy = addDays(acclimatizeBy, -(Number(p.rootingDays) || 0));
  const multiplyBy = addDays(rootingBy, -cycles * (Number(p.cycleDays) || 0));
  const slackDays = Math.round((Date.parse(multiplyBy) - Date.parse(opts.today)) / DAY);
  return { sellable, toAcclimatize, toRoot, cycles, dates: { multiplyBy, rootingBy, acclimatizeBy, dueAt: o.dueAt }, slackDays, feasible: slackDays >= 0 };
}

// ── Quy đổi đơn vị & giá thành ──────────────────────────────────────

const MASS: Record<string, number> = { "µg": 1e-6, mg: 1e-3, g: 1, kg: 1e3 };
const VOLUME: Record<string, number> = { "µl": 1e-3, ml: 1, l: 1e3 };

/** Quy đổi lượng giữa 2 đơn vị cùng loại (khối lượng / thể tích); khác loại hoặc lạ → null. Cùng tên → giữ nguyên. */
export function convertQty(amount: number, from: string, to: string): number | null {
  const f = from.trim(), t = to.trim();
  if (f === t) return amount;
  if (f in MASS && t in MASS) return (amount * MASS[f]) / MASS[t];
  const fl = f.toLowerCase(), tl = t.toLowerCase();
  if (fl in VOLUME && tl in VOLUME) return (amount * VOLUME[fl]) / VOLUME[tl];
  return null;
}

/** Chi phí hóa chất / 1 lít môi trường; `missing` = dòng chưa gắn vật tư hoặc đơn vị không quy đổi được. */
export function mediaCostPerLiter(
  lines: { chemical: string; amountPerL: number; unit: string; supplyId: string }[],
  supplies: Map<string, { unit: string; unitPrice: number }>,
) {
  let cost = 0;
  const missing: string[] = [];
  for (const l of lines) {
    const s = supplies.get(l.supplyId);
    const qty = s ? convertQty(Number(l.amountPerL) || 0, l.unit, s.unit) : null;
    if (!s || qty == null) missing.push(l.chemical);
    else cost += qty * (Number(s.unitPrice) || 0);
  }
  return { cost, missing };
}

export type CostRates = { laborPerVessel: number; overheadPerVessel: number; nurseryPerPlant: number };

/**
 * Giá thành 1 chồi / cây của mẻ: (chồi nhận từ mẻ cha × giá thành chồi mẻ cha + chi phí trực tiếp của mẻ) ÷ chồi thu được.
 * Chi phí trực tiếp = số bình × (môi trường / bình + nhân công / bình + chi phí chung / bình).
 * Chặn vòng lặp; mẻ chưa có chồi thu được → null.
 */
export function costPerPlantlet<B extends { id: string; parentBatchId: string; explants: number; vessels: number; plantlets: number; mediaBatchId: string }>(
  batchId: string,
  batches: Map<string, B>,
  mediaCostPerVessel: (mediaBatchId: string) => number,
  rates: CostRates,
  seen = new Set<string>(),
): number | null {
  const b = batches.get(batchId);
  if (!b || seen.has(batchId)) return null;
  seen.add(batchId);
  const vessels = Number(b.vessels) || 0;
  const direct = vessels * ((b.mediaBatchId ? mediaCostPerVessel(b.mediaBatchId) : 0) + (Number(rates.laborPerVessel) || 0) + (Number(rates.overheadPerVessel) || 0));
  let inherited = 0;
  if (b.parentBatchId) {
    const parentUnit = costPerPlantlet(b.parentBatchId, batches, mediaCostPerVessel, rates, seen);
    if (parentUnit != null) inherited = (Number(b.explants) || 0) * parentUnit;
  }
  const out = Number(b.plantlets) || 0;
  return out > 0 ? (inherited + direct) / out : null;
}

/** Giá thành lô ra ngôi và giá thành 1 cây sống (chia cho số cây sống). */
export function lotCost(lot: { quantity: number; survived: number }, unitFromBatch: number | null, rates: CostRates) {
  if (unitFromBatch == null) return null;
  const q = Number(lot.quantity) || 0;
  const total = q * unitFromBatch + q * (Number(rates.nurseryPerPlant) || 0);
  const alive = Number(lot.survived) || 0;
  return { total: Math.round(total), perPlant: alive > 0 ? Math.round(total / alive) : null };
}

// ── Kho, đơn hàng ───────────────────────────────────────────────────

/** Tồn kho = nhập − xuất ± điều chỉnh. */
export function stockOf(moves: { kind: string; quantity: number }[]) {
  return moves.reduce((s, m) => s + (m.kind === "Xuất" ? -1 : 1) * (Number(m.quantity) || 0), 0);
}

/** Số đã giao, % hoàn thành, giao đúng hạn (đủ số lượng trước hoặc đúng ngày cần giao). */
export function orderProgress(o: { quantity: number; dueAt: string }, sales: { quantity: number; soldAt: string }[]) {
  const delivered = sales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
  const q = Number(o.quantity) || 0;
  const byDue = o.dueAt ? sales.filter((x) => x.soldAt && x.soldAt <= o.dueAt).reduce((s, x) => s + (Number(x.quantity) || 0), 0) : delivered;
  return { delivered, pct: q > 0 ? Math.min(100, Math.round((delivered / q) * 100)) : 0, onTime: q > 0 && byDue >= q };
}

/** Kiểm tra phân loại vườn ươm: Loại 1 + Loại 2 + không đạt không vượt số cây sống. */
export function validateGrading(l: { survived: number; grade1Qty: number; grade2Qty: number; rejectQty: number; quantity: number }) {
  if ((Number(l.survived) || 0) > (Number(l.quantity) || 0)) return "Số cây sống không được lớn hơn số cây ra ngôi";
  const graded = (Number(l.grade1Qty) || 0) + (Number(l.grade2Qty) || 0) + (Number(l.rejectQty) || 0);
  if (graded > (Number(l.survived) || 0)) return "Tổng cây Loại 1, Loại 2, không đạt vượt số cây sống";
  return null;
}
