import { NextResponse } from "next/server";
import { serviceRequestStore } from "@/lib/modules/m4/data/portal";
import { quotationStore } from "@/lib/modules/m4/data/sales";
import { nextDocCode } from "@/lib/modules/m4/finance";
import { quotationDraft } from "@/lib/modules/m4/workspace";
import { authorize } from "@/lib/platform/data/access";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Lập báo giá nháp từ yêu cầu (đã gắn khách hàng) và liên kết hai bên. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.services");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const r = (await serviceRequestStore.list()).find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  if (!r.customerId) return NextResponse.json({ error: "Gắn hồ sơ khách hàng cho yêu cầu trước khi lập báo giá" }, { status: 400 });
  if (r.status === "Hoàn thành" || r.status === "Từ chối") return NextResponse.json({ error: `Yêu cầu đã đóng (${r.status})` }, { status: 400 });
  const quotations = await quotationStore.list();
  const linked = quotations.find((q) => q.id === r.quotationId);
  if (linked) return NextResponse.json({ error: `Yêu cầu đã có báo giá ${linked.code}` }, { status: 409 });
  const today = todayISO();
  const q = await quotationStore.create({
    id: "",
    code: nextDocCode("BG", Number(today.slice(0, 4)), quotations.map((x) => x.code)),
    ...quotationDraft(r, r.customerId, today),
    amount: 0,
    vatRate: 8,
    status: "Nháp",
    preparedBy: gate.actor.name,
    submittedBy: "",
    submittedAt: "",
    approvedBy: "",
    approvedAt: "",
    decisionNote: "",
  });
  await logChange({ entity: "quotations", entityId: q.id, action: "Thêm", label: `${q.code} (từ yêu cầu ${r.code})` });
  const patch = { quotationId: q.id, ...(r.status === "Mới tiếp nhận" ? { status: "Đang xử lý" as const } : {}) };
  await serviceRequestStore.update(r.id, patch);
  await logChange({ entity: "service-requests", entityId: r.id, action: "Sửa", label: r.code, changes: diffFields(r, patch) });
  return NextResponse.json({ ok: true, item: { id: q.id, code: q.code } }, { status: 201 });
}
