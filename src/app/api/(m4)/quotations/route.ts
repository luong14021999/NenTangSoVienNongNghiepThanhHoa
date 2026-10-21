import { quotationStore, type Quotation } from "@/lib/modules/m4/data/sales";
import { createRoute, listRoute } from "@/lib/platform/api/crud";
import { nextDocCode } from "@/lib/modules/m4/finance";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

export const GET = listRoute(quotationStore);

const create = createRoute<Quotation>(
  quotationStore,
  (b) => ({
    id: "",
    code: (b.code ?? "").trim(),
    customerId: b.customerId ?? "",
    title: b.title ?? "",
    issuedAt: b.issuedAt ?? "",
    validUntil: b.validUntil ?? "",
    amount: 0,
    vatRate: b.vatRate ?? 8,
    status: "Nháp", // báo giá mới luôn là nháp; số tiền = tổng dòng
    preparedBy: b.preparedBy ?? "",
    submittedBy: "",
    submittedAt: "",
    approvedBy: "",
    approvedAt: "",
    decisionNote: "",
    note: b.note ?? "",
  }),
  (b) => (!b.title ? "Thiếu nội dung báo giá" : null),
);

/** Để trống số báo giá → tự đánh BG-<năm>-<số kế tiếp> (cột code unique chặn trùng). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!String(body.code ?? "").trim()) {
    const codes = (await quotationStore.list()).map((q) => q.code);
    body.code = nextDocCode("BG", Number(todayISO().slice(0, 4)), codes);
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return create(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
