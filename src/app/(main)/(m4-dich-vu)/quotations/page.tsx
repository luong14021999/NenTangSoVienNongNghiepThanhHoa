import Link from "next/link";
import { FileSpreadsheet, Stamp, Send, Banknote } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { QUOTATION_STATUSES, quotationStore } from "@/lib/modules/m4/data/sales";
import { fmtVND, quotationTotal } from "@/lib/modules/m4/finance";
import { quotationStatusVariant } from "@/lib/modules/m4/ui";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Báo giá" };

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const [all, customers] = await Promise.all([quotationStore.list(), getCustomers()]);
  const customerById = byId(customers);
  // Số tiền = tổng dòng (sửa ở trang chi tiết); trạng thái đổi qua nút quy trình.
  const fields: CrudField[] = [
    { name: "code", label: "Số báo giá (để trống = tự đánh số)", mono: true, placeholder: "BG-2026-001" },
    { name: "customerId", label: "Khách hàng", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "title", label: "Nội dung dịch vụ", required: true, full: true, placeholder: "VD: Phân tích 20 mẫu đất – 8 chỉ tiêu" },
    { name: "validUntil", label: "Hiệu lực đến", type: "date" },
    { name: "vatRate", label: "Thuế GTGT (%)", type: "number", defaultValue: 8 },
    { name: "preparedBy", label: "Người lập" },
    { name: "note", label: "Điều kiện / ghi chú (in trên báo giá)", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((x) => (!status || x.status === status) && matches(query, x.code, x.title, customerById.get(x.customerId)?.name));
  const accepted = all.filter((x) => x.status === "Được chấp nhận");

  return (
    <>
      <Header title="Báo giá dịch vụ" description="Lập báo giá theo bảng giá, trình duyệt, gửi khách và theo dõi kết quả" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Báo giá", value: all.length, icon: FileSpreadsheet, accent: "bg-blue-50 text-blue-600" },
            { label: "Chờ duyệt", value: all.filter((x) => x.status === "Chờ duyệt").length, icon: Stamp, accent: "bg-amber-50 text-amber-600" },
            { label: "Chờ khách phản hồi", value: all.filter((x) => x.status === "Đã gửi").length, icon: Send, accent: "bg-violet-50 text-violet-600" },
            {
              label: "Giá trị được chấp nhận",
              value: fmtVND(accepted.reduce((s, x) => s + quotationTotal(x.amount, x.vatRate), 0)),
              icon: Banknote,
              accent: "bg-emerald-50 text-emerald-700",
              hint: "sau thuế",
            },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {["", ...QUOTATION_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={`/quotations?${new URLSearchParams({ ...(q && { q }), ...(s && { status: s }) })}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                status === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >
              {s || "Tất cả"} <span className="ml-1.5 opacity-70">{s ? all.filter((x) => x.status === s).length : all.length}</span>
            </Link>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/quotations" placeholder="Tìm số, nội dung, khách hàng…" />
          </div>
        </div>
        <CrudTableCard
          title="Danh sách báo giá"
          description="Bấm số báo giá để thêm dòng dịch vụ, trình duyệt, in và lập hợp đồng"
          endpoint="/api/quotations"
          entity="quotations"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/quotations" title="Lập báo giá (nháp)" fields={fields} addLabel="Lập báo giá" />}
          headers={["Số / ngày", "Khách hàng", "Nội dung", "Tổng (sau thuế)", "Hiệu lực", "Trạng thái"]}
          emptyText={query || status ? "Không có báo giá phù hợp" : "Chưa có báo giá nào"}
          rows={rows.map((x) => {
            const days = daysUntil(x.validUntil);
            const expiring = x.status === "Đã gửi" && days <= 7;
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <Link href={`/quotations/${x.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{x.code}</Link>
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
                <Badge key="s" variant={quotationStatusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
