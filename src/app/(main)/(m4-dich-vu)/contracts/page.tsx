import { FileSignature, PlayCircle, Banknote, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { CONTRACT_STATUSES, DELIVERY_METHODS, contractStore, paymentStore, quotationStore, type Contract } from "@/lib/modules/m4/data/sales";
import { contractAlerts, contractBalances, fmtVND } from "@/lib/modules/m4/finance";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hợp đồng & công nợ" };

const statusVariant: Record<Contract["status"], "secondary" | "default" | "success" | "destructive" | "warning" | "outline"> = {
  "Đang soạn": "secondary",
  "Đã ký": "default",
  "Đang thực hiện": "warning",
  "Đã nghiệm thu": "success",
  "Đã thanh lý": "outline",
  "Hủy": "destructive",
};

/** Hợp đồng còn phát sinh công nợ (đã ký trở đi, chưa hủy). */
const billable = (c: Contract) => c.status !== "Đang soạn" && c.status !== "Hủy";

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, payments, quotations, customers] = await Promise.all([
    contractStore.list(),
    paymentStore.list(),
    quotationStore.list(),
    getCustomers(),
  ]);
  const customerById = byId(customers);
  const balances = contractBalances(all, payments);
  const fields: CrudField[] = [
    { name: "code", label: "Số hợp đồng", required: true, mono: true, placeholder: "VD: HĐ-2026-001" },
    { name: "customerId", label: "Khách hàng", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "title", label: "Tên hợp đồng", required: true, full: true },
    { name: "quotationId", label: "Theo báo giá", type: "select", options: refOptions(quotations, (x) => `${x.code} · ${x.title}`) },
    { name: "value", label: "Giá trị sau thuế (VND)", type: "number" },
    { name: "signedAt", label: "Ngày ký", type: "date" },
    { name: "startAt", label: "Bắt đầu", type: "date" },
    { name: "endAt", label: "Kết thúc", type: "date" },
    { name: "status", label: "Trạng thái", type: "select", options: [...CONTRACT_STATUSES] },
    { name: "owner", label: "Cán bộ phụ trách" },
    { name: "resultDueAt", label: "Hạn trả kết quả", type: "date" },
    { name: "paymentDueAt", label: "Hạn thanh toán", type: "date" },
    { name: "deliveredAt", label: "Ngày đã trả kết quả", type: "date" },
    { name: "deliveryMethod", label: "Hình thức trả kết quả", type: "select", options: ["", ...DELIVERY_METHODS] },
    { name: "deliveryRecipient", label: "Người nhận kết quả", full: true },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((x) => matches(query, x.code, x.title, x.owner, customerById.get(x.customerId)?.name));
  const active = all.filter(billable);
  const totalValue = active.reduce((s, c) => s + (Number(c.value) || 0), 0);
  const totalDebt = active.reduce((s, c) => s + (balances.get(c.id)?.debt ?? 0), 0);
  const today = todayISO();
  const alertsOf = (c: Contract) => contractAlerts(c, balances.get(c.id)?.debt ?? 0, today);

  return (
    <>
      <Header title="Hợp đồng & công nợ" description="Hợp đồng dịch vụ KH&CN, tiến độ thực hiện, số đã thu và công nợ còn lại" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Hợp đồng", value: all.length, icon: FileSignature, accent: "bg-blue-50 text-blue-600" },
            { label: "Có cảnh báo thời hạn", value: all.filter((c) => alertsOf(c).length > 0).length, icon: PlayCircle, accent: "bg-amber-50 text-amber-600", hint: "trễ / sắp đến hạn" },
            { label: "Giá trị đã ký", value: fmtVND(totalValue), icon: Banknote, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Công nợ phải thu", value: fmtVND(totalDebt), icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/contracts" placeholder="Tìm số, tên, khách hàng, cán bộ…" />
        </div>
        <CrudTableCard
          title="Danh sách hợp đồng"
          description="Công nợ = giá trị hợp đồng − tổng các lần thanh toán (trang Thanh toán)"
          endpoint="/api/contracts"
          entity="contracts"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/contracts" title="Thêm hợp đồng" fields={fields} addLabel="Thêm hợp đồng" />}
          headers={["Số / ngày ký", "Khách hàng", "Hợp đồng", "Giá trị", "Đã thu / còn nợ", "Thời hạn", "Trạng thái"]}
          emptyText={query ? "Không có hợp đồng phù hợp" : "Chưa có hợp đồng nào"}
          rows={rows.map((x) => {
            const b = balances.get(x.id) ?? { paid: 0, debt: 0 };
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{x.code}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.signedAt)}</div>
                </div>,
                <span key="k" className="text-sm">{customerById.get(x.customerId)?.name ?? "—"}</span>,
                <div key="t" className="max-w-[280px]">
                  <div className="text-sm">{clip(x.title, 80)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {[x.owner, x.startAt && `${fmtDateVN(x.startAt)} → ${fmtDateVN(x.endAt) || "…"}`].filter(Boolean).join(" · ")}
                  </div>
                </div>,
                <span key="v" className="text-sm font-semibold whitespace-nowrap">{fmtVND(x.value)}</span>,
                <div key="p" className="text-xs whitespace-nowrap">
                  <div>{fmtVND(b.paid)}</div>
                  {billable(x) && b.debt > 0 && <div className="text-rose-600 font-medium">nợ {fmtVND(b.debt)}</div>}
                </div>,
                <div key="d" className="text-[11px] whitespace-nowrap">
                  {x.resultDueAt && <div>KQ: {fmtDateVN(x.resultDueAt)}{x.deliveredAt && ` · đã trả ${fmtDateVN(x.deliveredAt)}`}</div>}
                  {x.paymentDueAt && <div>TT: {fmtDateVN(x.paymentDueAt)}</div>}
                  {alertsOf(x).map((a) => (
                    <div key={a.kind} className={a.kind.startsWith("Sắp") ? "text-amber-600" : "text-rose-600 font-medium"}>
                      {a.kind} {a.days ? `${a.days} ngày` : "hôm nay"}
                    </div>
                  ))}
                  {!x.resultDueAt && !x.paymentDueAt && <span className="text-muted-foreground">—</span>}
                </div>,
                <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
