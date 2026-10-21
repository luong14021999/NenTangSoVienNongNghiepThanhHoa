import Link from "next/link";
import { Inbox, Stamp, AlertTriangle, Wallet, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { contractStore, interactionStore, paymentStore, quotationStore } from "@/lib/modules/m4/data/sales";
import { serviceRequestStore } from "@/lib/modules/m4/data/portal";
import { AGING_BUCKETS, agingBucket, contractAlerts, contractBalances, daysBetween, fmtVND, quotationTotal } from "@/lib/modules/m4/finance";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tổng quan dịch vụ" };

/** Yêu cầu chưa phân xử lý quá số ngày này bị coi là chậm. */
const REQUEST_SLA_DAYS = 2;

type Alert = { href: string; code: string; who: string; text: string; tone: "red" | "amber" };

export default async function M4OverviewPage() {
  const [requests, quotations, contracts, payments, interactions, customers] = await Promise.all([
    serviceRequestStore.list(),
    quotationStore.list(),
    contractStore.list(),
    paymentStore.list(),
    interactionStore.list(),
    getCustomers(),
  ]);
  const today = todayISO();
  const customerById = byId(customers);
  const name = (id: string) => customerById.get(id)?.name ?? "";
  const balances = contractBalances(contracts, payments);
  const billable = contracts.filter((c) => c.status !== "Đang soạn" && c.status !== "Hủy");

  const alerts: Alert[] = [];
  for (const r of requests) {
    const age = daysBetween((r.createdAt || "").slice(0, 10), today);
    if (r.status === "Mới tiếp nhận" && age >= REQUEST_SLA_DAYS) {
      alerts.push({ href: `/service-requests?q=${encodeURIComponent(r.code)}`, code: r.code, who: r.contactName, text: `Yêu cầu chưa xử lý ${age} ngày · ${r.targetUnit}`, tone: "red" });
    }
  }
  for (const q of quotations) {
    if (q.status === "Chờ duyệt") alerts.push({ href: `/quotations/${q.id}`, code: q.code, who: name(q.customerId), text: "Báo giá chờ duyệt", tone: "amber" });
    const left = daysBetween(today, q.validUntil);
    if (q.status === "Đã gửi" && Number.isFinite(left) && left <= 7) {
      alerts.push({ href: `/quotations/${q.id}`, code: q.code, who: name(q.customerId), text: left < 0 ? `Báo giá quá hiệu lực ${-left} ngày – chuyển Hết hạn hoặc liên hệ khách` : `Báo giá còn ${left} ngày hiệu lực, khách chưa phản hồi`, tone: left < 0 ? "red" : "amber" });
    }
  }
  for (const c of contracts) {
    for (const a of contractAlerts(c, balances.get(c.id)?.debt ?? 0, today)) {
      alerts.push({ href: `/contracts?q=${encodeURIComponent(c.code)}`, code: c.code, who: name(c.customerId), text: `${a.kind}${a.days ? ` ${a.days} ngày` : " hôm nay"}`, tone: a.kind.startsWith("Sắp") ? "amber" : "red" });
    }
  }
  for (const i of interactions) {
    if (i.nextActionAt && i.nextAction && daysBetween(i.nextActionAt, today) >= 0) {
      alerts.push({ href: `/customers/${i.customerId}`, code: fmtDateVN(i.nextActionAt), who: name(i.customerId), text: `Việc chăm sóc đến hạn: ${i.nextAction}`, tone: "amber" });
    }
  }
  alerts.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "red" ? -1 : 1));

  // Phân tuổi công nợ theo hạn thanh toán (hợp đồng chưa đặt hạn → Trong hạn).
  const aging = new Map(AGING_BUCKETS.map((b) => [b, { amount: 0, count: 0 }]));
  for (const c of billable) {
    const debt = balances.get(c.id)?.debt ?? 0;
    if (debt <= 0) continue;
    const bucket = agingBucket(daysBetween(c.paymentDueAt, today));
    const cur = aging.get(bucket)!;
    cur.amount += debt;
    cur.count += 1;
  }
  const totalDebt = [...aging.values()].reduce((s, b) => s + b.amount, 0);
  const year = today.slice(0, 4);

  return (
    <>
      <Header title="Tổng quan dịch vụ" description="Việc cần xử lý, cảnh báo thời hạn và công nợ của M4" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Yêu cầu mới", value: requests.filter((r) => r.status === "Mới tiếp nhận").length, icon: Inbox, accent: "bg-blue-50 text-blue-600" },
            { label: "Báo giá chờ duyệt", value: quotations.filter((q) => q.status === "Chờ duyệt").length, icon: Stamp, accent: "bg-amber-50 text-amber-600" },
            { label: `Đã thu ${year}`, value: fmtVND(payments.filter((p) => (p.paidAt || "").startsWith(year)).reduce((s, p) => s + p.amount, 0)), icon: Wallet, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Công nợ phải thu", value: fmtVND(totalDebt), icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
          ]}
        />
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4" />Việc cần xử lý <span className="text-muted-foreground font-normal text-sm">({alerts.length})</span></CardTitle>
              <CardDescription>Yêu cầu chậm, báo giá chờ duyệt / sắp hết hiệu lực, hợp đồng trễ hạn, công nợ quá hạn, lịch chăm sóc khách hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {alerts.slice(0, 40).map((a, i) => (
                  <li key={`${a.code}-${i}`} className="py-2 flex items-start gap-3">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.tone === "red" ? "bg-rose-500" : "bg-amber-400"}`} />
                    <Link href={a.href} className="font-mono text-xs text-primary hover:underline shrink-0 mt-0.5">{a.code}</Link>
                    <span className="min-w-0">
                      {a.text}
                      {a.who && <span className="text-muted-foreground"> · {a.who}</span>}
                    </span>
                  </li>
                ))}
                {alerts.length === 0 && <li className="py-6 text-center text-muted-foreground">Không có việc tồn đọng</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tuổi công nợ</CardTitle>
              <CardDescription>Theo số ngày quá hạn thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {AGING_BUCKETS.map((b) => {
                const v = aging.get(b)!;
                const pct = totalDebt > 0 ? Math.round((v.amount / totalDebt) * 100) : 0;
                return (
                  <div key={b}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{b}</span>
                      <span className="text-xs text-muted-foreground">{v.count} HĐ · {fmtVND(v.amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${b === "Trong hạn" ? "bg-emerald-500" : b === "1–30 ngày" ? "bg-amber-400" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <Link href="/revenue" className="inline-block text-xs text-primary hover:underline pt-2">Báo cáo doanh thu →</Link>
            </CardContent>
          </Card>
        </section>
        <Card>
          <CardHeader><CardTitle>Báo giá đang mở</CardTitle><CardDescription>Đã duyệt / đã gửi, chưa có kết quả</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {quotations.filter((q) => q.status === "Đã duyệt" || q.status === "Đã gửi").slice(0, 10).map((q) => (
                <li key={q.id} className="py-2 flex flex-wrap gap-x-3 justify-between">
                  <span><Link href={`/quotations/${q.id}`} className="font-mono text-xs text-primary hover:underline">{q.code}</Link> <span className="text-muted-foreground">{name(q.customerId)}</span></span>
                  <span className="text-xs">{q.status} · {fmtVND(quotationTotal(q.amount, q.vatRate))}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
