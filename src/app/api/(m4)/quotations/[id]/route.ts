import { NextResponse } from "next/server";
import { quotationStore } from "@/lib/modules/m4/data/sales";
import { itemRoutes } from "@/lib/platform/api/crud";
import { getQuotation } from "@/lib/modules/m4/data/quotation-flow";
import { quotationLocked } from "@/lib/modules/m4/finance";

export const dynamic = "force-dynamic";

const routes = itemRoutes(quotationStore);

/** Trạng thái và người duyệt chỉ đổi qua quy trình; số tiền = tổng dòng; đã trình duyệt thì khóa giá trị. */
const WORKFLOW_FIELDS = ["status", "submittedBy", "submittedAt", "approvedBy", "approvedAt", "decisionNote", "amount", "code"];
const LOCKED_FIELDS = ["vatRate", "customerId", "title"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = await getQuotation(id);
  if (!q) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  for (const k of WORKFLOW_FIELDS) delete body[k];
  if (quotationLocked(q.status)) {
    const touched = LOCKED_FIELDS.filter((k) => k in body && String(body[k] ?? "") !== String((q as Record<string, unknown>)[k] ?? ""));
    if (touched.length) return NextResponse.json({ error: "Báo giá đã trình duyệt – mở lại thành nháp để sửa khách hàng, nội dung hoặc thuế" }, { status: 400 });
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.PATCH(new Request(req.url, { method: "PATCH", headers, body: JSON.stringify(body) }), ctx);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const q = await getQuotation((await ctx.params).id);
  if (q && !["Nháp", "Từ chối", "Hết hạn"].includes(q.status)) {
    return NextResponse.json({ error: `Không xóa báo giá đang ở trạng thái ${q.status}` }, { status: 400 });
  }
  return routes.DELETE(req, ctx);
}
