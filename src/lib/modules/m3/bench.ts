// Thao tác trên bàn cấy (M3.1): cấy chuyển, ra ngôi, ghi nhiễm – hàm thuần, route chỉ đọc / ghi.
import { CULTURE_STAGES, type CultureBatch, type SeedlingLot } from "./data/tissue";

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const stageRank = (s: string) => (CULTURE_STAGES as readonly string[]).indexOf(s);

/** Giai đoạn kế tiếp trong dây chuyền (giai đoạn cuối / lạ → giữ nguyên). */
export function nextStage(stage: string) {
  const i = stageRank(stage);
  return i >= 0 && i < CULTURE_STAGES.length - 1 ? CULTURE_STAGES[i + 1] : stage;
}

export type TransferInput = {
  code: string;
  stage: string;
  startedAt: string;
  vessels: number;
  mediaBatchId?: string;
  recipeId?: string;
  nextTransferAt?: string;
  cabinetId?: string;
  operator?: string;
  /** Số chồi / cây thu được từ mẻ cha khi cấy chuyển (ghi vào mẻ cha). */
  harvested?: number;
  /** Số bình nhiễm của mẻ cha ghi nhận lần cuối trước khi cấy chuyển. */
  parentContaminated?: number;
  note?: string;
};

/**
 * Cấy chuyển: tạo mẻ con nối phả hệ (mẻ cha, cùng vật liệu, đơn hàng, phòng) và đóng mẻ cha.
 * Không cho lùi giai đoạn; cùng giai đoạn → tăng lần cấy chuyển, sang giai đoạn mới → đếm lại từ 1.
 */
export function transferPlan(parent: CultureBatch, input: TransferInput):
  | { error: string }
  | { child: Omit<CultureBatch, "id">; parentPatch: Partial<CultureBatch> } {
  if (parent.status !== "Đang nuôi") return { error: `Mẻ ${parent.code} không còn đang nuôi (${parent.status})` };
  const code = String(input.code ?? "").trim();
  if (!code) return { error: "Thiếu mã mẻ mới" };
  if (code === parent.code) return { error: "Mã mẻ mới phải khác mã mẻ cha" };
  const stage = String(input.stage || parent.stage);
  if (stageRank(stage) >= 0 && stageRank(parent.stage) >= 0 && stageRank(stage) < stageRank(parent.stage))
    return { error: `Không cấy chuyển lùi giai đoạn (${parent.stage} → ${stage})` };
  const vessels = n(input.vessels);
  if (vessels <= 0) return { error: "Số bình cấy của mẻ mới phải lớn hơn 0" };
  if (!input.startedAt) return { error: "Thiếu ngày cấy chuyển" };
  if (parent.startedAt && input.startedAt < parent.startedAt) return { error: "Ngày cấy chuyển trước ngày cấy của mẻ cha" };
  if (input.nextTransferAt && input.nextTransferAt < input.startedAt) return { error: "Hạn cấy chuyển kế tiếp trước ngày cấy" };
  const contaminated = input.parentContaminated == null ? n(parent.contaminated) : n(input.parentContaminated);
  if (contaminated < 0 || contaminated > n(parent.vessels)) return { error: `Số bình nhiễm của mẻ cha phải từ 0 đến ${n(parent.vessels)}` };
  const harvested = input.harvested == null ? n(parent.plantlets) : n(input.harvested);
  if (harvested < 0) return { error: "Số chồi thu không hợp lệ" };

  const child: Omit<CultureBatch, "id"> = {
    code,
    materialId: parent.materialId,
    recipeId: input.recipeId || parent.recipeId,
    stage,
    subcultureNo: stage === parent.stage ? n(parent.subcultureNo) + 1 : 1,
    startedAt: input.startedAt,
    nextTransferAt: input.nextTransferAt ?? "",
    vessels,
    contaminated: 0,
    plantlets: 0,
    room: parent.room,
    operator: input.operator || parent.operator,
    status: "Đang nuôi",
    parentBatchId: parent.id,
    mediaBatchId: input.mediaBatchId ?? "",
    cabinetId: input.cabinetId || parent.cabinetId,
    roomId: parent.roomId,
    explants: harvested,
    survived: 0,
    orderId: parent.orderId,
    note: input.note ?? "",
  };
  return { child, parentPatch: { status: "Đã cấy chuyển", contaminated, plantlets: harvested } };
}

export type AcclimatizeInput = {
  code: string;
  acclimatizedAt: string;
  quantity: number;
  nurseryBed?: string;
  readyAt?: string;
  note?: string;
};

/** Ra ngôi: lập lô cây giống vườn ươm từ mẻ (thường ở giai đoạn Ra rễ / Ra ngôi) và đóng mẻ. */
export function acclimatizePlan(batch: CultureBatch, input: AcclimatizeInput):
  | { error: string }
  | { lot: Omit<SeedlingLot, "id">; batchPatch: Partial<CultureBatch> } {
  if (batch.status !== "Đang nuôi") return { error: `Mẻ ${batch.code} không còn đang nuôi (${batch.status})` };
  if (stageRank(batch.stage) >= 0 && stageRank(batch.stage) < stageRank("Ra rễ"))
    return { error: `Mẻ đang ở giai đoạn ${batch.stage} – cần cấy sang Ra rễ trước khi ra ngôi` };
  const code = String(input.code ?? "").trim();
  if (!code) return { error: "Thiếu mã lô cây giống" };
  const quantity = n(input.quantity);
  if (quantity <= 0) return { error: "Số cây ra ngôi phải lớn hơn 0" };
  if (!input.acclimatizedAt) return { error: "Thiếu ngày ra ngôi" };
  if (batch.startedAt && input.acclimatizedAt < batch.startedAt) return { error: "Ngày ra ngôi trước ngày cấy của mẻ" };
  if (input.readyAt && input.readyAt < input.acclimatizedAt) return { error: "Ngày dự kiến đủ tiêu chuẩn trước ngày ra ngôi" };
  const lot: Omit<SeedlingLot, "id"> = {
    code,
    batchId: batch.id,
    acclimatizedAt: input.acclimatizedAt,
    quantity,
    survived: quantity,
    grade: "",
    customerId: "",
    releasedAt: "",
    releasedQty: 0,
    status: "Vườn ươm",
    orderId: batch.orderId,
    nurseryBed: input.nurseryBed ?? "",
    readyAt: input.readyAt ?? "",
    grade1Qty: 0,
    grade2Qty: 0,
    rejectQty: 0,
    note: input.note ?? "",
  };
  return { lot, batchPatch: { status: "Chuyển ra ngôi", plantlets: Math.max(n(batch.plantlets), quantity) } };
}

/** Ghi nhiễm khi kiểm tra bình: số bình nhiễm cộng dồn, không vượt số bình. */
export function recordContamination(batch: Pick<CultureBatch, "vessels" | "contaminated">, added: number): { error: string } | { contaminated: number } {
  const a = n(added);
  if (!Number.isInteger(a) || a <= 0) return { error: "Số bình nhiễm thêm phải là số nguyên dương" };
  const total = n(batch.contaminated) + a;
  if (total > n(batch.vessels)) return { error: `Tổng số bình nhiễm (${total}) vượt số bình cấy (${n(batch.vessels)})` };
  return { contaminated: total };
}

/** Cộng / trừ số ngày cho "YYYY-MM-DD". */
export function addDays(iso: string, days: number) {
  return new Date(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** "YYYY-MM" hợp lệ, nếu không → tháng của `fallback`. */
export function parseMonth(v: string | undefined, fallback: string) {
  return v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : fallback.slice(0, 7);
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** Lưới lịch tháng: các tuần (thứ Hai → Chủ nhật), mỗi ô có ngày và cờ thuộc tháng. */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const shift = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(first, -shift);
  const next = `${shiftMonth(month, 1)}-01`;
  const weeks: { date: string; inMonth: boolean }[][] = [];
  for (let d = start; d < next || weeks.at(-1)?.length !== 7; d = addDays(d, 1)) {
    if (!weeks.length || weeks.at(-1)!.length === 7) weeks.push([]);
    weeks.at(-1)!.push({ date: d, inMonth: d.slice(0, 7) === month });
  }
  return weeks;
}

/** Gợi ý mã mới chưa dùng: "MC-01" → "MC-01-1", "MC-01-2"…; mã đã có hậu tố số thì tăng tiếp. */
export function suggestCode(base: string, existing: Iterable<string>) {
  const used = new Set(existing);
  const m = /^(.+)-([1-9]\d?)$/.exec(base);
  const stem = m ? m[1] : base;
  let i = m ? Number(m[2]) + 1 : 1;
  while (used.has(`${stem}-${i}`)) i++;
  return `${stem}-${i}`;
}
