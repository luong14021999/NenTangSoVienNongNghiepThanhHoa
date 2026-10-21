import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Inbox, FileSpreadsheet, FileSignature, Wallet, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { INTERACTION_KINDS, contractStore, interactionStore, paymentStore, quotationStore } from "@/lib/modules/m4/data/sales";
import { serviceRequestStore } from "@/lib/modules/m4/data/portal";
import { contractBalances, fmtVND, quotationTotal } from "@/lib/modules/m4/finance";
import { quotationStatusVariant } from "@/lib/modules/m4/ui";
import { daysUntil, fmtDateTimeVN, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hồ sơ khách hàng" };

/** Hồ sơ khách hàng 360° (quan hệ khách hàng – M4.2). */
export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customers = await getCustomers();
  const c = customers.find((x) => x.id === id);
  if (!c) notFound();
  const [requests, quotations, contracts, payments, interactions] = await Promise.all([
    serviceRequestStore.list(),
    quotationStore.list(),
    contractStore.list(),
    paymentStore.list(),
    interactionStore.list(),
  ]);
  const myRequests = requests.filter((r) => r.customerId === id).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const myQuotes = quotations.filter((q) => q.customerId === id).sort((a, b) => b.code.localeCompare(a.code));
  const myContracts = contracts.filter((x) => x.customerId === id).sort((a, b) => b.code.localeCompare(a.code));
  const myContractIds = new Set(myContracts.map((x) => x.id));
  const myPayments = payments.filter((p) => myContractIds.has(p.contractId));
  const balances = contractBalances(myContracts, myPayments);
  const billable = myContracts.filter((x) => x.status !== "Đang soạn" && x.status !== "Hủy");
  const debt = billable.reduce((s, x) => s + (balances.get(x.id)?.debt ?? 0), 0);
  const myInteractions = interactions.filter((i) => i.customerId === id).sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));

  const fields: CrudField[] = [
    { name: "customerId", label: "Khách hàng", type: "select", options: [{ value: c.id, label: c.name }], defaultValue: c.id },
    { name: "occurredAt", label: "Ngày", type: "date" },
    { name: "kind", label: "Hình thức", type: "select", options: [...INTERACTION_KINDS] },
    { name: "staff", label: "Cán bộ" },
    { name: "content", label: "Nội dung trao đổi", type: "textarea", required: true },
    { name: "nextAction", label: "Việc tiếp theo", full: true },
    { name: "nextActionAt", label: "Hẹn ngày", type: "date" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  return (
    <>
      <Header title={c.name} description={`${c.code} · ${c.kind}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Danh sách khách hàng
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {c.contact && <span>Liên hệ: <span className="text-foreground">{c.contact}</span></span>}
          {c.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{c.phone}</span>}
          {c.address && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{c.address}</span>}
          <span>Mẫu phân tích năm nay: <span className="text-foreground font-medium">{c.samplesYTD}</span></span>
        </div>
        <StatGrid
          stats={[
            { label: "Yêu cầu dịch vụ", value: myRequests.length, icon: Inbox, accent: "bg-blue-50 text-blue-600" },
            { label: "Báo giá", value: myQuotes.length, icon: FileSpreadsheet, accent: "bg-violet-50 text-violet-600", hint: `${myQuotes.filter((q) => q.status === "Được chấp nhận").length} được chấp nhận` },
            { label: "Giá trị hợp đồng", value: fmtVND(billable.reduce((s, x) => s + x.value, 0)), icon: FileSignature, accent: "bg-emerald-50 text-emerald-700", hint: `đã thu ${fmtVND(myPayments.reduce((s, p) => s + p.amount, 0))}` },
            { label: "Công nợ", value: fmtVND(debt), icon: debt > 0 ? AlertTriangle : Wallet, accent: debt > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600" },
          ]}
        />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Yêu cầu gần đây</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {myRequests.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span className="min-w-0"><span className="font-mono text-xs">{r.code}</span> <span className="text-xs text-muted-foreground">{fmtDateTimeVN(r.createdAt)}</span></span>
                    <Badge variant="outline">{r.status}</Badge>
                  </li>
                ))}
                {myRequests.length === 0 && <li className="text-muted-foreground text-xs">Chưa có – gắn khách hàng ở trang Yêu cầu dịch vụ</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Báo giá</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {myQuotes.slice(0, 6).map((q) => (
                  <li key={q.id} className="flex justify-between gap-2">
                    <Link href={`/quotations/${q.id}`} className="font-mono text-xs text-primary hover:underline">{q.code}</Link>
                    <span className="text-xs whitespace-nowrap">{fmtVND(quotationTotal(q.amount, q.vatRate))}</span>
                    <Badge variant={quotationStatusVariant[q.status] ?? "secondary"}>{q.status}</Badge>
                  </li>
                ))}
                {myQuotes.length === 0 && <li className="text-muted-foreground text-xs">Chưa có báo giá</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Hợp đồng</CardTitle><CardDescription>Đã thu / còn nợ</CardDescription></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {myContracts.slice(0, 6).map((x) => {
                  const b = balances.get(x.id) ?? { paid: 0, debt: 0 };
                  return (
                    <li key={x.id} className="flex justify-between gap-2 text-xs">
                      <Link href={`/contracts?q=${encodeURIComponent(x.code)}`} className="font-mono text-primary hover:underline">{x.code}</Link>
                      <span className="whitespace-nowrap">{fmtVND(b.paid)}{b.debt > 0 && x.status !== "Đang soạn" && x.status !== "Hủy" && <span className="text-rose-600"> · nợ {fmtVND(b.debt)}</span>}</span>
                    </li>
                  );
                })}
                {myContracts.length === 0 && <li className="text-muted-foreground text-xs">Chưa có hợp đồng</li>}
              </ul>
            </CardContent>
          </Card>
        </section>

        <CrudTableCard
          title="Nhật ký chăm sóc khách hàng"
          description="Cuộc gọi, gặp gỡ, khiếu nại, khảo sát hài lòng và việc cần làm tiếp"
          endpoint="/api/customer-interactions"
          entity="customer-interactions"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/customer-interactions" title="Ghi nhật ký chăm sóc" fields={fields} addLabel="Ghi nhật ký" />}
          headers={["Ngày", "Hình thức", "Nội dung", "Cán bộ", "Việc tiếp theo"]}
          emptyText="Chưa có nhật ký"
          rows={myInteractions.map((i) => {
            const due = i.nextActionAt && daysUntil(i.nextActionAt) <= 0;
            return {
              id: i.id,
              label: i.kind,
              initial: i,
              cells: [
                <span key="d" className="text-xs whitespace-nowrap">{fmtDateVN(i.occurredAt)}</span>,
                <Badge key="k" variant={i.kind === "Khiếu nại" ? "destructive" : "outline"}>{i.kind}</Badge>,
                <span key="c" className="text-sm whitespace-pre-line">{i.content}</span>,
                <span key="s" className="text-xs">{i.staff || "—"}</span>,
                <div key="n" className="text-xs">
                  {i.nextAction || "—"}
                  {i.nextActionAt && <div className={due ? "text-rose-600 font-medium" : "text-muted-foreground"}>{fmtDateVN(i.nextActionAt)}</div>}
                </div>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
