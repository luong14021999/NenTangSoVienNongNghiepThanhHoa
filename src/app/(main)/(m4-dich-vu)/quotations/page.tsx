import { FileSpreadsheet, Send, CheckCircle2, Banknote } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { QUOTATION_STATUSES, quotationStore, type Quotation } from "@/lib/modules/m4/data/sales";
import { fmtVND, quotationTotal } from "@/lib/modules/m4/finance";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Báo giá" };

const statusVariant: Record<Quotation["status"], "secondary" | "default" | "success" | "destructive" | "warning"> = {
  "Nháp": "secondary",
  "Đã gửi": "default",
  "Được chấp nhận": "success",
  "Từ chối": "destructive",
  "Hết hạn": "warning",
};

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, customers] = await Promise.all([quotationStore.list(), getCustomers()]);
  const customerById = byId(customers);
  const fields: CrudField[] = [
    { name: "code", label: "Số báo giá", required: true, mono: true, placeholder: "VD: BG-2026-001" },
    { name: "customerId", label: "Khách hàng", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "title", label: "Nội dung dịch vụ", required: true, full: true, placeholder: "VD: Phân tích 20 mẫu đất – 8 chỉ tiêu" },
    { name: "issuedAt", label: "Ngày báo giá", type: "date" },
    { name: "validUntil", label: "Hiệu lực đến", type: "date" },
    { name: "amount", label: "Giá trước thuế (VND)", type: "number" },
    { name: "vatRate", label: "Thuế GTGT (%)", type: "number", defaultValue: 8 },
    { name: "status", label: "Trạng thái", type: "select", options: [...QUOTATION_STATUSES] },
    { name: "preparedBy", label: "Người lập" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const sorted = [...all].sort((a, b) => b.code.localeCompare(a.code));
  const rows = sorted.filter((x) => matches(query, x.code, x.title, customerById.get(x.customerId)?.name));
  const open = all.filter((x) => x.status === "Đã gửi");
  const accepted = all.filter((x) => x.status === "Được chấp nhận");

  return (
    <>
      <Header title="Báo giá dịch vụ" description="Lập, gửi và theo dõi báo giá dịch vụ KH&CN cho khách hàng" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Báo giá", value: all.length, icon: FileSpreadsheet, accent: "bg-blue-50 text-blue-600" },
            { label: "Chờ khách phản hồi", value: open.length, icon: Send, accent: "bg-amber-50 text-amber-600" },
            { label: "Được chấp nhận", value: accepted.length, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
            {
              label: "Giá trị được chấp nhận",
              value: fmtVND(accepted.reduce((s, x) => s + quotationTotal(x.amount, x.vatRate), 0)),
              icon: Banknote,
              accent: "bg-violet-50 text-violet-600",
              hint: "sau thuế",
            },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/quotations" placeholder="Tìm số, nội dung, khách hàng…" />
        </div>
        <CrudTableCard
          title="Danh sách báo giá"
          description="Báo giá được chấp nhận là căn cứ lập hợp đồng"
          endpoint="/api/quotations"
          entity="quotations"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/quotations" title="Lập báo giá" fields={fields} addLabel="Lập báo giá" />}
          headers={["Số / ngày", "Khách hàng", "Nội dung", "Tổng (sau thuế)", "Hiệu lực", "Trạng thái"]}
          emptyText={query ? "Không có báo giá phù hợp" : "Chưa có báo giá nào"}
          rows={rows.map((x) => {
            const days = daysUntil(x.validUntil);
            const expiring = x.status === "Đã gửi" && days <= 7;
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{x.code}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.issuedAt)}</div>
                </div>,
                <span key="k" className="text-sm">{customerById.get(x.customerId)?.name ?? "—"}</span>,
                <span key="t" className="text-sm">{clip(x.title, 80)}</span>,
                <div key="v" className="text-sm font-semibold whitespace-nowrap">
                  {fmtVND(quotationTotal(x.amount, x.vatRate))}
                  <div className="text-[11px] text-muted-foreground font-normal">VAT {x.vatRate}%</div>
                </div>,
                <span key="h" className={`text-xs ${expiring ? "text-rose-600 font-medium" : ""}`}>
                  {fmtDateVN(x.validUntil) || "—"}
                  {expiring && (days < 0 ? ` · quá ${-days} ngày` : ` · còn ${days} ngày`)}
                </span>,
                <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
