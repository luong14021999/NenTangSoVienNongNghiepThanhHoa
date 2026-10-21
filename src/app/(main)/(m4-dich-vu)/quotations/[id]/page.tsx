import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, Trash2, FileSignature } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/platform/action-button";
import { QuotationLineForm } from "@/components/m4/quotations/line-form";
import { QuotationWorkflowButtons } from "@/components/m4/quotations/workflow-buttons";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { contractStore } from "@/lib/modules/m4/data/sales";
import { priceItemStore } from "@/lib/modules/m4/data/portal";
import { getQuotation, linesOf } from "@/lib/modules/m4/data/quotation-flow";
import { allowedActions, fmtVND, lineAmount, linesSummary, quotationLocked, quotationTotal, type QuotationAction } from "@/lib/modules/m4/finance";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN, fmtDateVN } from "@/lib/platform/dates";
import { quotationStatusVariant } from "@/lib/modules/m4/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chi tiết báo giá" };

const APPROVER_ACTIONS: QuotationAction[] = ["approve", "return"];

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await getQuotation(id);
  if (!q) notFound();
  const [lines, customers, items, contracts, access] = await Promise.all([
    linesOf(id),
    getCustomers(),
    priceItemStore.list(),
    contractStore.list(),
    currentAccess(),
  ]);
  const customer = customers.find((c) => c.id === q.customerId);
  const summary = linesSummary(lines);
  const total = quotationTotal(q.amount, q.vatRate);
  const locked = quotationLocked(q.status);
  const contract = contracts.find((c) => c.quotationId === id && c.status !== "Hủy");
  const canWrite = access.can("write.services");
  const canApprove = access.can("services.approve");
  // Chỉ hiện nút người dùng được làm; người trình không thấy nút Duyệt báo giá của chính mình.
  const actions = allowedActions(q.status).filter((a) => {
    if (APPROVER_ACTIONS.includes(a)) return canApprove && !(a === "approve" && q.submittedBy.toLowerCase() === (access.actor?.email ?? "").toLowerCase());
    return canWrite;
  });

  return (
    <>
      <Header title={`Báo giá ${q.code}`} description={q.title} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/quotations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-auto">
            <ArrowLeft className="w-4 h-4" /> Danh sách báo giá
          </Link>
          <Link href={`/quotation-print/${id}`} target="_blank" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent">
            <Printer className="w-4 h-4" /> In báo giá
          </Link>
          {q.status === "Được chấp nhận" && !contract && canWrite && (
            <ActionButton url={`/api/quotations/${id}/contract`} label="Lập hợp đồng" icon={<FileSignature />} variant="default" success="Đã lập hợp đồng (Đang soạn)" confirm="Lập hợp đồng từ báo giá này?" />
          )}
          {contract && (
            <Link href={`/contracts?q=${encodeURIComponent(contract.code)}`} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent">
              <FileSignature className="w-4 h-4" /> Hợp đồng {contract.code}
            </Link>
          )}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Thông tin <Badge variant={quotationStatusVariant[q.status] ?? "secondary"}>{q.status}</Badge>
              </CardTitle>
              <CardDescription>Sửa khách hàng, nội dung, thuế ở danh sách báo giá (khi còn Nháp)</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Khách hàng</dt>
                <dd>{customer ? <Link href={`/customers/${customer.id}`} className="text-primary hover:underline">{customer.name}</Link> : "—"}</dd>
                <dt className="text-muted-foreground">Ngày gửi khách</dt><dd>{fmtDateVN(q.issuedAt) || "—"}</dd>
                <dt className="text-muted-foreground">Hiệu lực đến</dt><dd>{fmtDateVN(q.validUntil) || "—"}</dd>
                <dt className="text-muted-foreground">Người lập</dt><dd>{q.preparedBy || "—"}</dd>
                <dt className="text-muted-foreground">Trình duyệt</dt><dd>{q.submittedBy ? `${q.submittedBy} · ${fmtDateTimeVN(q.submittedAt)}` : "—"}</dd>
                <dt className="text-muted-foreground">Phê duyệt</dt><dd>{q.approvedBy ? `${q.approvedBy} · ${fmtDateTimeVN(q.approvedAt)}` : "—"}</dd>
                {q.decisionNote && (<><dt className="text-muted-foreground">Ghi nhận</dt><dd className="text-rose-700">{q.decisionNote}</dd></>)}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Giá trị</CardTitle>
              <CardDescription>Giá thành theo định mức – chỉ hiển thị nội bộ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Cộng (chưa thuế)</span><span>{fmtVND(q.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Thuế GTGT {q.vatRate}%</span><span>{fmtVND(total - q.amount)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-1.5"><span>Tổng cộng</span><span>{fmtVND(total)}</span></div>
              <div className="flex justify-between text-xs pt-2"><span className="text-muted-foreground">Giá thành định mức</span><span>{summary.cost ? fmtVND(summary.cost) : "chưa có định mức"}</span></div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tỷ suất lợi nhuận</span>
                <span className={summary.margin != null && summary.margin < 0 ? "text-rose-600 font-medium" : ""}>{summary.margin == null ? "—" : `${summary.margin.toLocaleString("vi-VN")}%`}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Dòng dịch vụ</CardTitle>
              <CardDescription>{locked ? "Đã trình duyệt – mở lại thành nháp (hoặc được trả lại) để sửa" : "Chọn dịch vụ trong bảng giá; đơn giá chưa gồm thuế GTGT"}</CardDescription>
            </div>
            <QuotationWorkflowButtons id={id} actions={actions} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 w-8">#</th>
                    <th className="text-left font-medium px-3 py-2">Nội dung</th>
                    <th className="text-right font-medium px-3 py-2">SL</th>
                    <th className="text-left font-medium px-3 py-2">ĐVT</th>
                    <th className="text-right font-medium px-3 py-2">Đơn giá</th>
                    <th className="text-right font-medium px-3 py-2">Giảm</th>
                    <th className="text-right font-medium px-3 py-2">Thành tiền</th>
                    {!locked && canWrite && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((l, i) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2">{l.description}</td>
                      <td className="px-3 py-2 text-right">{l.quantity.toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2">{l.unit}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{fmtVND(l.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">{l.discountPct ? `${l.discountPct}%` : ""}</td>
                      <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{fmtVND(lineAmount(l))}</td>
                      {!locked && canWrite && (
                        <td className="px-1">
                          <ActionButton url={`/api/quotation-lines/${l.id}`} method="DELETE" label="" icon={<Trash2 />} variant="ghost" success="Đã xóa dòng" />
                        </td>
                      )}
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground text-sm">Chưa có dòng dịch vụ</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {!locked && canWrite && (
              <QuotationLineForm quotationId={id} items={items.map((i) => ({ id: i.id, code: i.code, name: i.name, unit: i.unit, price: i.price }))} />
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
