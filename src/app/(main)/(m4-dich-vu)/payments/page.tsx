import { Wallet, CalendarDays, Landmark, Receipt } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { PAYMENT_METHODS, contractStore, paymentStore } from "@/lib/modules/m4/data/sales";
import { fmtVND } from "@/lib/modules/m4/finance";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thanh toán" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, contracts, customers] = await Promise.all([paymentStore.list(), contractStore.list(), getCustomers()]);
  const contractById = byId(contracts);
  const customerById = byId(customers);
  const fields: CrudField[] = [
    { name: "code", label: "Số chứng từ", required: true, mono: true, placeholder: "VD: PT-2026-001" },
    { name: "contractId", label: "Hợp đồng", type: "select", required: true, options: refOptions(contracts, (c) => `${c.code} · ${c.title}`) },
    { name: "paidAt", label: "Ngày thu", type: "date" },
    { name: "amount", label: "Số tiền (VND)", type: "number", required: true },
    { name: "method", label: "Hình thức", type: "select", options: [...PAYMENT_METHODS] },
    { name: "invoiceNo", label: "Số hóa đơn điện tử", mono: true },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const customerOf = (contractId: string) => customerById.get(contractById.get(contractId)?.customerId ?? "")?.name;
  const rows = [...all]
    .sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""))
    .filter((x) => matches(query, x.code, x.invoiceNo, contractById.get(x.contractId)?.code, customerOf(x.contractId)));
  const month = todayISO().slice(0, 7);
  const sum = (xs: typeof all) => xs.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  return (
    <>
      <Header title="Thanh toán" description="Ghi nhận các khoản thu theo hợp đồng, đối chiếu hóa đơn điện tử" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tổng đã thu", value: fmtVND(sum(all)), icon: Wallet, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Thu trong tháng", value: fmtVND(sum(all.filter((x) => (x.paidAt || "").startsWith(month)))), icon: CalendarDays, accent: "bg-blue-50 text-blue-600" },
            { label: "Chuyển khoản", value: all.filter((x) => x.method === "Chuyển khoản").length, icon: Landmark, accent: "bg-violet-50 text-violet-600", hint: "lần thu" },
            { label: "Chưa có hóa đơn", value: all.filter((x) => !x.invoiceNo).length, icon: Receipt, accent: "bg-amber-50 text-amber-600", hint: "lần thu" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/payments" placeholder="Tìm chứng từ, hóa đơn, hợp đồng, khách hàng…" />
        </div>
        <CrudTableCard
          title="Các khoản đã thu"
          description="Mỗi khoản thu gắn với một hợp đồng để tính công nợ"
          endpoint="/api/payments"
          entity="payments"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/payments" title="Ghi nhận thanh toán" fields={fields} addLabel="Ghi nhận thanh toán" />}
          headers={["Chứng từ / ngày", "Hợp đồng", "Khách hàng", "Số tiền", "Hình thức", "Hóa đơn"]}
          emptyText={query ? "Không có khoản thu phù hợp" : "Chưa có khoản thu nào"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.code,
            initial: x,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{x.code}</div>
                <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.paidAt)}</div>
              </div>,
              <span key="h" className="font-mono text-xs">{contractById.get(x.contractId)?.code ?? "—"}</span>,
              <span key="k" className="text-sm">{customerOf(x.contractId) ?? "—"}</span>,
              <span key="v" className="text-sm font-semibold whitespace-nowrap">{fmtVND(x.amount)}</span>,
              <Badge key="m" variant="outline">{x.method}</Badge>,
              <span key="i" className={`font-mono text-xs ${x.invoiceNo ? "" : "text-amber-600"}`}>{x.invoiceNo || "chưa xuất"}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
