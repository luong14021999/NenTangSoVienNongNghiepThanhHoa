// M4.2 Báo cáo doanh thu phục vụ phương án tự chủ tài chính (dùng chung cho trang và file CSV).
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { contractStore, paymentStore, quotationLineStore, quotationStore } from "@/lib/modules/m4/data/sales";
import { priceItemStore } from "@/lib/modules/m4/data/portal";
import { lineAmount, marginPct, monthsOf, quotationTotal, sumByMonth } from "@/lib/modules/m4/finance";

export async function revenueReport(year: number) {
  const [contracts, payments, quotations, lines, items, customers] = await Promise.all([
    contractStore.list(),
    paymentStore.list(),
    quotationStore.list(),
    quotationLineStore.list(),
    priceItemStore.list(),
    getCustomers(),
  ]);
  const months = monthsOf(year);
  const y = String(year);
  const signed = contracts.filter((c) => c.status !== "Đang soạn" && c.status !== "Hủy" && (c.signedAt || "").startsWith(y));
  const paidInYear = payments.filter((p) => (p.paidAt || "").startsWith(y));

  const byMonth = {
    months,
    contracted: sumByMonth(signed, (c) => c.signedAt, (c) => c.value, months),
    collected: sumByMonth(paidInYear, (p) => p.paidAt, (p) => p.amount, months),
  };

  // Theo nhóm dịch vụ: dòng của báo giá được chấp nhận có ngày gửi trong năm (doanh thu chưa thuế + giá thành định mức).
  const acceptedIds = new Set(quotations.filter((q) => q.status === "Được chấp nhận" && (q.issuedAt || "").startsWith(y)).map((q) => q.id));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const cat = new Map<string, { revenue: number; cost: number }>();
  for (const l of lines) {
    if (!acceptedIds.has(l.quotationId)) continue;
    const k = itemById.get(l.priceItemId)?.category || "Khác / nhập tay";
    const cur = cat.get(k) ?? { revenue: 0, cost: 0 };
    cur.revenue += lineAmount(l);
    cur.cost += (Number(l.quantity) || 0) * (Number(l.unitCost) || 0);
    cat.set(k, cur);
  }
  const byCategory = [...cat.entries()]
    .map(([category, v]) => ({ category, revenue: v.revenue, cost: Math.round(v.cost), margin: marginPct(v.revenue, v.cost) }))
    .sort((a, b) => b.revenue - a.revenue);

  // Theo khách hàng: giá trị hợp đồng ký trong năm + số đã thu trong năm.
  const contractById = new Map(contracts.map((c) => [c.id, c]));
  const cust = new Map<string, { contracted: number; collected: number }>();
  for (const c of signed) {
    const cur = cust.get(c.customerId) ?? { contracted: 0, collected: 0 };
    cur.contracted += c.value;
    cust.set(c.customerId, cur);
  }
  for (const p of paidInYear) {
    const cid = contractById.get(p.contractId)?.customerId ?? "";
    const cur = cust.get(cid) ?? { contracted: 0, collected: 0 };
    cur.collected += p.amount;
    cust.set(cid, cur);
  }
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const byCustomer = [...cust.entries()]
    .map(([id, v]) => ({ id, name: customerById.get(id)?.name ?? "(chưa gắn khách hàng)", kind: customerById.get(id)?.kind ?? "", ...v }))
    .sort((a, b) => b.contracted + b.collected - (a.contracted + a.collected));

  const totals = {
    contracted: byMonth.contracted.reduce((s, v) => s + v, 0),
    collected: byMonth.collected.reduce((s, v) => s + v, 0),
    quotedAccepted: quotations.filter((q) => acceptedIds.has(q.id)).reduce((s, q) => s + quotationTotal(q.amount, q.vatRate), 0),
    revenueExVat: byCategory.reduce((s, c) => s + c.revenue, 0),
    cost: byCategory.reduce((s, c) => s + c.cost, 0),
  };
  return { year, byMonth, byCategory, byCustomer, totals };
}
