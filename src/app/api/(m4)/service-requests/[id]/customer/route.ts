import { NextResponse } from "next/server";
import { customersStore, getCustomers } from "@/lib/modules/m4/data/customers";
import { serviceRequestStore } from "@/lib/modules/m4/data/portal";
import { customerDraft, matchCustomer } from "@/lib/modules/m4/workspace";
import { authorize } from "@/lib/platform/data/access";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/**
 * Gắn yêu cầu với hồ sơ khách hàng: theo khách được chọn, hoặc khách sẵn có trùng số điện thoại / tên,
 * hoặc lập hồ sơ mới (cần thêm quyền ghi khách hàng).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.requests");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const r = (await serviceRequestStore.list()).find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { customerId?: string };
  const customers = await getCustomers();
  let customer = body.customerId ? customers.find((c) => c.id === body.customerId) ?? null : matchCustomer(r, customers);
  if (body.customerId && !customer) return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
  let created = false;
  if (!customer) {
    const gate2 = await authorize("write.reception");
    if (!gate2.ok) return gate2.response;
    const draft = customerDraft(r, customers.map((c) => c.code), Number(todayISO().slice(0, 4)));
    const c = await customersStore.create({ id: "", ...draft, samplesYTD: 0, lastSampleAt: "" });
    await logChange({ entity: "customers", entityId: c.id, action: "Thêm", label: `${c.code} (từ yêu cầu ${r.code})` });
    customer = { ...c, source: "db" };
    created = true;
  }
  const patch = { customerId: customer.id, ...(r.status === "Mới tiếp nhận" ? { status: "Đang xử lý" as const } : {}) };
  await serviceRequestStore.update(r.id, patch);
  await logChange({ entity: "service-requests", entityId: r.id, action: "Sửa", label: r.code, changes: diffFields(r, patch) });
  return NextResponse.json({ ok: true, customer: { id: customer.id, code: customer.code, name: customer.name }, created });
}
