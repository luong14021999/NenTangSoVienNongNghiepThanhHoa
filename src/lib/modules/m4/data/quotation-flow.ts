// M4.2 – nghiệp vụ báo giá phía server: dòng báo giá, quy trình phê duyệt, lập hợp đồng từ báo giá.
import { contractStore, quotationLineStore, quotationStore, type Quotation, type QuotationLine } from "@/lib/modules/m4/data/sales";
import { priceItemStore } from "@/lib/modules/m4/data/portal";
import { linesSummary, nextDocCode, nextQuotationStatus, quotationLocked, quotationTotal, unitCostOf } from "@/lib/modules/m4/finance";
import { logChange } from "@/lib/platform/data/change-log";
import { todayISO } from "@/lib/platform/dates";

type Actor = { name: string; email: string };
type Result<T> = { ok: true; value: T } | { ok: false; error: string; status: number };
const fail = (error: string, status = 400) => ({ ok: false as const, error, status });

export async function getQuotation(id: string) {
  return (await quotationStore.list()).find((q) => q.id === id) ?? null;
}

export async function linesOf(quotationId: string) {
  return (await quotationLineStore.list()).filter((l) => l.quotationId === quotationId).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Số tiền báo giá (chưa thuế) = tổng các dòng. */
async function recomputeAmount(q: Quotation) {
  const { amount } = linesSummary(await linesOf(q.id));
  return quotationStore.update(q.id, { amount });
}

export async function addLine(
  quotationId: string,
  b: { priceItemId?: string; description?: string; unit?: string; quantity?: number; unitPrice?: number; discountPct?: number },
): Promise<Result<QuotationLine>> {
  const q = await getQuotation(quotationId);
  if (!q) return fail("Không tìm thấy báo giá", 404);
  if (quotationLocked(q.status)) return fail("Báo giá đã trình duyệt – mở lại thành nháp để sửa");
  const item = b.priceItemId ? (await priceItemStore.list()).find((p) => p.id === b.priceItemId) : undefined;
  if (b.priceItemId && !item) return fail("Không tìm thấy dịch vụ trong bảng giá");
  const description = (b.description || item?.name || "").trim();
  if (!description) return fail("Chọn dịch vụ trong bảng giá hoặc nhập nội dung");
  const quantity = Number(b.quantity ?? 1);
  if (!(quantity > 0)) return fail("Số lượng phải lớn hơn 0");
  const discountPct = Number(b.discountPct ?? 0);
  if (discountPct < 0 || discountPct > 100) return fail("Giảm giá phải từ 0 đến 100%");
  const unitPrice = b.unitPrice != null && String(b.unitPrice) !== "" && Number(b.unitPrice) > 0 ? Number(b.unitPrice) : Number(item?.price ?? 0);
  const existing = await linesOf(quotationId);
  const line = await quotationLineStore.create({
    id: "",
    quotationId,
    priceItemId: item?.id ?? "",
    description,
    unit: (b.unit || item?.unit || "mẫu").trim(),
    quantity,
    unitPrice,
    discountPct,
    unitCost: item ? unitCostOf(item) : 0,
    sortOrder: existing.length,
  });
  await recomputeAmount(q);
  await logChange({ entity: "quotations", entityId: q.id, action: "Sửa", label: q.code, changes: [{ field: "thêm dòng", old: "", new: `${description} × ${quantity}` }] });
  return { ok: true, value: line };
}

export async function removeLine(lineId: string): Promise<Result<true>> {
  const line = (await quotationLineStore.list()).find((l) => l.id === lineId);
  if (!line) return fail("Không tìm thấy dòng", 404);
  const q = await getQuotation(line.quotationId);
  if (!q) return fail("Không tìm thấy báo giá", 404);
  if (quotationLocked(q.status)) return fail("Báo giá đã trình duyệt – mở lại thành nháp để sửa");
  await quotationLineStore.remove(lineId);
  await recomputeAmount(q);
  await logChange({ entity: "quotations", entityId: q.id, action: "Sửa", label: q.code, changes: [{ field: "xóa dòng", old: `${line.description} × ${line.quantity}`, new: "" }] });
  return { ok: true, value: true };
}

/** Thực hiện 1 bước quy trình; ghi người trình / người duyệt và nhật ký thay đổi. */
export async function applyAction(id: string, action: string, note: string, actor: Actor, canApprove: boolean): Promise<Result<Quotation>> {
  const q = await getQuotation(id);
  if (!q) return fail("Không tìm thấy báo giá", 404);
  const r = nextQuotationStatus(q, action, { actorEmail: actor.email, canApprove });
  if ("error" in r) return fail(r.error, action === "approve" || action === "return" ? 403 : 400);
  const now = new Date().toISOString();
  const patch: Partial<Quotation> = { status: r.to };
  if (action === "submit") Object.assign(patch, { submittedBy: actor.email, submittedAt: now, approvedBy: "", approvedAt: "", decisionNote: "" });
  if (action === "approve") Object.assign(patch, { approvedBy: actor.name, approvedAt: now });
  if (action === "send" && !q.issuedAt) patch.issuedAt = todayISO();
  if (["return", "decline", "reopen"].includes(action)) patch.decisionNote = note.slice(0, 1000);
  if (action === "reopen" || action === "return") Object.assign(patch, { approvedBy: "", approvedAt: "" });
  const updated = await quotationStore.update(id, patch);
  if (!updated) return fail("Không cập nhật được báo giá", 500);
  await logChange({
    entity: "quotations",
    entityId: id,
    action: "Sửa",
    label: q.code,
    actor: actor.name,
    changes: [{ field: "trạng thái", old: q.status, new: r.to + (note ? ` – ${note.slice(0, 200)}` : "") }],
  });
  return { ok: true, value: updated };
}

/** Lập hợp đồng từ báo giá khách đã chấp nhận (giá trị = tổng sau thuế). */
export async function contractFromQuotation(id: string, actor: Actor): Promise<Result<{ id: string; code: string }>> {
  const q = await getQuotation(id);
  if (!q) return fail("Không tìm thấy báo giá", 404);
  if (q.status !== "Được chấp nhận") return fail("Chỉ lập hợp đồng từ báo giá khách đã chấp nhận");
  const contracts = await contractStore.list();
  const existing = contracts.find((c) => c.quotationId === id && c.status !== "Hủy");
  if (existing) return fail(`Báo giá đã có hợp đồng ${existing.code}`, 409);
  const year = Number(todayISO().slice(0, 4));
  const created = await contractStore.create({
    id: "",
    code: nextDocCode("HĐ", year, contracts.map((c) => c.code)),
    customerId: q.customerId,
    quotationId: q.id,
    title: q.title,
    signedAt: "",
    startAt: "",
    endAt: "",
    value: quotationTotal(q.amount, q.vatRate),
    status: "Đang soạn",
    owner: actor.name,
    resultDueAt: "",
    paymentDueAt: "",
    deliveredAt: "",
    deliveryMethod: "",
    deliveryRecipient: "",
    note: `Lập từ báo giá ${q.code}`,
  });
  await logChange({ entity: "contracts", entityId: created.id, action: "Thêm", label: created.code, actor: actor.name });
  return { ok: true, value: { id: created.id, code: created.code } };
}
