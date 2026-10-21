import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, FileSignature, FileSpreadsheet, Inbox, PenLine, Send, Truck, UserPlus, Wallet } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/platform/action-button";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { QuotationWorkflowButtons } from "@/components/m4/quotations/workflow-buttons";
import { WorkBoard, type Tone, type WorkCard, type WorkColumn } from "@/components/common/work-board";
import { compactVND } from "@/components/m4/overview/format";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { serviceRequestStore } from "@/lib/modules/m4/data/portal";
import { DELIVERY_METHODS, PAYMENT_METHODS, contractStore, paymentStore, quotationStore, type Contract, type Quotation } from "@/lib/modules/m4/data/sales";
import { allowedActions, contractBalances, daysBetween, fmtVND, nextDocCode, quotationTotal, type QuotationAction } from "@/lib/modules/m4/finance";
import { matchCustomer } from "@/lib/modules/m4/workspace";
import { currentAccess } from "@/lib/platform/data/access";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng giao dịch" };

/** Số ngày phải phản hồi yêu cầu mới (đồng bộ với trang tổng quan M4). */
const SLA_DAYS = 2;
const APPROVER_ACTIONS: QuotationAction[] = ["approve", "return"];

const small = (icon: ReactNode, label: string, primary = false) => (
  <Button type="button" size="sm" variant={primary ? "default" : "outline"} className="h-7 gap-1 px-2 text-[11px]">
    {icon}
    {label}
  </Button>
);
const ageTone = (days: number, warn: number, danger: number): Tone => (days >= danger ? "red" : days >= warn ? "amber" : "muted");

/** M4.2 – bảng giao dịch: yêu cầu → báo giá → hợp đồng → nghiệm thu → thu tiền, thao tác ngay trên thẻ. */
export default async function DealBoardPage() {
  const [requests, quotations, contracts, payments, customers, access] = await Promise.all([
    serviceRequestStore.list(),
    quotationStore.list(),
    contractStore.list(),
    paymentStore.list(),
    getCustomers(),
    currentAccess(),
  ]);
  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const customerById = byId(customers);
  const who = (id: string) => customerById.get(id)?.name ?? "Chưa rõ khách";
  const balances = contractBalances(contracts, payments);
  const canRequests = access.can("write.requests");
  const canServices = access.can("write.services");
  const canApprove = access.can("services.approve");
  const me = (access.actor?.email ?? "").toLowerCase();
  const contractOfQuote = new Map(contracts.filter((c) => c.status !== "Hủy" && c.quotationId).map((c) => [c.quotationId, c]));
  const paymentCodes = payments.map((p) => p.code);

  const quoteActions = (q: Quotation) =>
    allowedActions(q.status).filter((a) => (APPROVER_ACTIONS.includes(a) ? canApprove && !(a === "approve" && q.submittedBy.toLowerCase() === me) : canServices));

  // ── 1. Yêu cầu chờ báo giá ─────────────────────────────────────────
  const waiting = requests
    .filter((r) => (r.status === "Mới tiếp nhận" || r.status === "Đang xử lý") && !r.quotationId)
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const requestCards: WorkCard[] = waiting.map((r) => {
    const age = Math.max(0, daysBetween(r.createdAt, today) || 0);
    const suggested = r.customerId ? null : matchCustomer(r, customers);
    return {
      id: r.id,
      code: r.code,
      href: `/request-inbox?box=all&id=${r.id}`,
      title: r.orgName || r.contactName,
      facts: [r.kind, r.sampleCount > 0 ? `${r.sampleCount} mẫu` : "", r.handler || "chưa phân công"],
      due: { label: age === 0 ? "hôm nay" : `${age} ngày`, tone: r.status === "Mới tiếp nhận" ? ageTone(age, SLA_DAYS, SLA_DAYS * 3) : "muted" },
      actions: !r.customerId ? (
        canRequests && <ActionButton url={`/api/service-requests/${r.id}/customer`} label={suggested ? `Gắn ${suggested.code}` : "Lập hồ sơ KH"} icon={<UserPlus />} success="Đã gắn khách hàng" confirm={suggested ? `Gắn với khách ${suggested.name}?` : `Lập hồ sơ khách “${r.orgName || r.contactName}”?`} />
      ) : (
        canServices && <ActionButton url={`/api/service-requests/${r.id}/quotation`} label="Lập báo giá" icon={<FileSpreadsheet />} variant="default" success="Đã lập báo giá nháp" confirm="Lập báo giá nháp từ yêu cầu này?" />
      ),
    };
  });

  // ── 2–3. Báo giá ───────────────────────────────────────────────────
  const quoteCard = (q: Quotation): WorkCard => {
    const total = quotationTotal(q.amount, q.vatRate);
    const left = daysBetween(today, q.validUntil);
    const actions = quoteActions(q);
    return {
      id: q.id,
      code: q.code,
      href: `/quotations/${q.id}`,
      title: who(q.customerId),
      facts: [q.status, q.title, q.preparedBy],
      metric: { label: total > 0 ? fmtVND(total) : "Chưa có dòng dịch vụ", tone: total > 0 ? "green" : "amber" },
      due: q.status === "Đã gửi" && Number.isFinite(left) ? { label: left < 0 ? `quá hiệu lực ${-left} ngày` : `hiệu lực còn ${left} ngày`, tone: left < 0 ? "red" : left <= 5 ? "amber" : "muted" } : undefined,
      actions: (
        <>
          {q.status === "Nháp" && canServices && (
            <Link href={`/quotations/${q.id}`} className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[11px] font-medium hover:bg-accent"><PenLine className="h-3.5 w-3.5" />Thêm dòng</Link>
          )}
          {actions.length > 0 && <div className="[&_button]:h-7 [&_button]:px-2 [&_button]:text-[11px]"><QuotationWorkflowButtons id={q.id} actions={actions} /></div>}
        </>
      ),
    };
  };
  const drafting = quotations.filter((q) => ["Nháp", "Chờ duyệt", "Đã duyệt"].includes(q.status)).sort((a, b) => a.status.localeCompare(b.status) || b.code.localeCompare(a.code));
  const sent = quotations.filter((q) => q.status === "Đã gửi").sort((a, b) => (a.validUntil || "9999").localeCompare(b.validUntil || "9999"));

  // ── 4. Lập & ký hợp đồng ───────────────────────────────────────────
  const signFields: CrudField[] = [
    { name: "status", label: "Trạng thái", type: "select", options: ["Đang soạn", "Đã ký", "Đang thực hiện"] },
    { name: "signedAt", label: "Ngày ký", type: "date" },
    { name: "startAt", label: "Bắt đầu", type: "date" },
    { name: "endAt", label: "Kết thúc", type: "date" },
    { name: "resultDueAt", label: "Hạn trả kết quả", type: "date" },
    { name: "paymentDueAt", label: "Hạn thanh toán", type: "date" },
    { name: "owner", label: "Cán bộ phụ trách" },
    { name: "value", label: "Giá trị (VND, đã gồm thuế)", type: "number" },
  ];
  const accepted = quotations.filter((q) => q.status === "Được chấp nhận" && !contractOfQuote.has(q.id));
  const draftContracts = contracts.filter((c) => c.status === "Đang soạn");
  const contractFacts = (c: Contract) => [c.title, c.owner, c.signedAt ? `ký ${fmtDateVN(c.signedAt)}` : ""];
  const signCards: WorkCard[] = [
    ...accepted.map<WorkCard>((q) => ({
      id: q.id,
      code: q.code,
      href: `/quotations/${q.id}`,
      title: who(q.customerId),
      facts: ["Khách đã chấp nhận báo giá", q.title],
      metric: { label: fmtVND(quotationTotal(q.amount, q.vatRate)), tone: "green" },
      actions: canServices && <ActionButton url={`/api/quotations/${q.id}/contract`} label="Lập hợp đồng" icon={<FileSignature />} variant="default" success="Đã lập hợp đồng (Đang soạn)" confirm="Lập hợp đồng từ báo giá này?" />,
    })),
    ...draftContracts.map<WorkCard>((c) => ({
      id: c.id,
      code: c.code,
      href: `/contracts?q=${encodeURIComponent(c.code)}`,
      title: who(c.customerId),
      facts: ["Đang soạn", ...contractFacts(c)],
      metric: { label: fmtVND(c.value), tone: "muted" },
      actions: canServices && (
        <EntityFormDialog mode="edit" endpoint="/api/contracts" id={c.id} title={`Ký hợp đồng ${c.code}`} fields={signFields} initial={{ ...c, status: "Đã ký", signedAt: c.signedAt || today, startAt: c.startAt || today }} successText="Đã cập nhật hợp đồng" trigger={small(<FileSignature />, "Ký hợp đồng", true)} />
      ),
    })),
  ];

  // ── 5. Đang thực hiện ──────────────────────────────────────────────
  const deliverFields: CrudField[] = [
    { name: "status", label: "Trạng thái", type: "select", options: ["Đang thực hiện", "Đã nghiệm thu"] },
    { name: "deliveredAt", label: "Ngày trả kết quả", type: "date" },
    { name: "deliveryMethod", label: "Hình thức trả", type: "select", options: ["", ...DELIVERY_METHODS] },
    { name: "deliveryRecipient", label: "Người nhận" },
    { name: "paymentDueAt", label: "Hạn thanh toán", type: "date" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const running = contracts.filter((c) => c.status === "Đã ký" || c.status === "Đang thực hiện").sort((a, b) => (a.resultDueAt || "9999").localeCompare(b.resultDueAt || "9999"));
  const runningCards: WorkCard[] = running.map((c) => {
    const left = c.deliveredAt ? NaN : daysBetween(today, c.resultDueAt);
    return {
      id: c.id,
      code: c.code,
      href: `/contracts?q=${encodeURIComponent(c.code)}`,
      title: who(c.customerId),
      facts: [c.status, ...contractFacts(c)],
      metric: { label: `${fmtVND(c.value)} · đã thu ${compactVND(balances.get(c.id)?.paid ?? 0)}`, tone: "muted" },
      due: Number.isFinite(left) ? { label: left < 0 ? `trễ kết quả ${-left} ngày` : `trả kết quả còn ${left} ngày`, tone: left < 0 ? "red" : left <= 3 ? "amber" : "muted" } : undefined,
      actions: canServices && (
        <EntityFormDialog mode="edit" endpoint="/api/contracts" id={c.id} title={`Trả kết quả & nghiệm thu – ${c.code}`} fields={deliverFields} initial={{ ...c, status: "Đã nghiệm thu", deliveredAt: c.deliveredAt || today, paymentDueAt: c.paymentDueAt || "" }} successText="Đã cập nhật hợp đồng" trigger={small(<Truck />, "Trả kết quả", true)} />
      ),
    };
  });

  // ── 6. Chờ thu tiền ────────────────────────────────────────────────
  const owing = contracts
    .filter((c) => (c.status === "Đã nghiệm thu" || c.status === "Đã thanh lý") && (balances.get(c.id)?.debt ?? 0) > 0)
    .sort((a, b) => (a.paymentDueAt || "9999").localeCompare(b.paymentDueAt || "9999"));
  const owingCards: WorkCard[] = owing.map((c) => {
    const debt = balances.get(c.id)?.debt ?? 0;
    const over = daysBetween(c.paymentDueAt, today);
    return {
      id: c.id,
      code: c.code,
      href: `/contracts?q=${encodeURIComponent(c.code)}`,
      title: who(c.customerId),
      facts: [c.title, c.deliveredAt ? `trả KQ ${fmtDateVN(c.deliveredAt)}` : ""],
      metric: { label: `Còn nợ ${fmtVND(debt)}`, tone: "amber" },
      due: Number.isFinite(over) ? { label: over > 0 ? `quá hạn TT ${over} ngày` : `hạn TT ${fmtDateVN(c.paymentDueAt)}`, tone: over > 30 ? "red" : over > 0 ? "amber" : "muted" } : { label: "chưa đặt hạn TT", tone: "muted" },
      actions: canServices && (
        <EntityFormDialog
          mode="add"
          endpoint="/api/payments"
          title={`Ghi thu – ${c.code}`}
          description={`Còn nợ ${fmtVND(debt)}.`}
          fields={[
            { name: "code", label: "Số chứng từ", required: true, mono: true },
            { name: "contractId", label: "Hợp đồng", type: "select", options: [{ value: c.id, label: c.code }] },
            { name: "paidAt", label: "Ngày thu", type: "date" },
            { name: "amount", label: "Số tiền (VND)", type: "number", required: true },
            { name: "method", label: "Hình thức", type: "select", options: [...PAYMENT_METHODS] },
            { name: "invoiceNo", label: "Số hóa đơn" },
            { name: "note", label: "Ghi chú", type: "textarea" },
          ]}
          initial={{ code: nextDocCode("PT", year, paymentCodes), contractId: c.id, paidAt: today, amount: debt }}
          successText="Đã ghi thu"
          trigger={small(<Wallet />, "Ghi thu", true)}
        />
      ),
    };
  });

  const sumVND = (xs: number[]) => compactVND(xs.reduce((s, x) => s + (Number(x) || 0), 0));
  const columns: WorkColumn[] = [
    { key: "requests", name: "Yêu cầu chờ báo giá", hint: "Gắn khách hàng rồi lập báo giá", summary: `${waiting.filter((r) => r.status === "Mới tiếp nhận").length} mới tiếp nhận`, icon: Inbox, cards: requestCards, emptyText: "Không có yêu cầu chờ" },
    { key: "drafting", name: "Soạn & duyệt báo giá", hint: "Nháp → Chờ duyệt → Đã duyệt", summary: sumVND(drafting.map((q) => quotationTotal(q.amount, q.vatRate))), icon: FileSpreadsheet, cards: drafting.map(quoteCard), emptyText: "Không có báo giá" },
    { key: "sent", name: "Đã gửi khách", hint: "Chờ khách chấp nhận / từ chối", summary: sumVND(sent.map((q) => quotationTotal(q.amount, q.vatRate))), icon: Send, cards: sent.map(quoteCard), emptyText: "Không có báo giá" },
    { key: "sign", name: "Lập & ký hợp đồng", hint: "Báo giá được chấp nhận, hợp đồng đang soạn", summary: sumVND([...accepted.map((q) => quotationTotal(q.amount, q.vatRate)), ...draftContracts.map((c) => c.value)]), icon: FileSignature, cards: signCards, emptyText: "Không có hợp đồng chờ ký" },
    { key: "running", name: "Đang thực hiện", hint: "Theo hạn trả kết quả", summary: sumVND(running.map((c) => c.value)), icon: BadgeCheck, cards: runningCards, emptyText: "Không có hợp đồng đang thực hiện" },
    { key: "owing", name: "Chờ thu tiền", hint: "Đã nghiệm thu, còn công nợ", summary: `còn nợ ${sumVND(owing.map((c) => balances.get(c.id)?.debt ?? 0))}`, icon: Wallet, cards: owingCards, emptyText: "Không có công nợ" },
  ];

  return (
    <>
      <Header title="Bảng giao dịch" description="Từ yêu cầu đến thu tiền: lập báo giá, trình duyệt, gửi khách, lập – ký hợp đồng, trả kết quả, ghi thu – ngay trên thẻ" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        <WorkBoard columns={columns} />
        <p className="text-[11px] text-muted-foreground">
          Người trình không thấy nút duyệt báo giá của chính mình. Danh sách đầy đủ: <Link href="/request-inbox" className="text-primary hover:underline">Hộp thư yêu cầu</Link> · <Link href="/quotations" className="text-primary hover:underline">Báo giá</Link> · <Link href="/contracts" className="text-primary hover:underline">Hợp đồng & công nợ</Link> · <Link href="/payments" className="text-primary hover:underline">Thanh toán</Link>.
        </p>
      </main>
    </>
  );
}
