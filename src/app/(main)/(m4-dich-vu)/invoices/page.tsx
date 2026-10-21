import { Receipt, FileCheck2, FileX2, Plug } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { INVOICE_STATUSES, contractStore, invoiceStore, type Invoice } from "@/lib/modules/m4/data/sales";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { EINVOICE_PROVIDERS, einvoiceConnection } from "@/lib/modules/m4/einvoice";
import { fmtVND, quotationTotal } from "@/lib/modules/m4/finance";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hóa đơn điện tử" };

const statusVariant: Record<Invoice["status"], "secondary" | "success" | "warning" | "destructive"> = {
  "Nháp": "secondary",
  "Đã phát hành": "success",
  "Đã thay thế": "warning",
  "Đã hủy": "destructive",
};

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, contracts, customers] = await Promise.all([invoiceStore.list(), contractStore.list(), getCustomers()]);
  const contractById = byId(contracts);
  const customerById = byId(customers);
  const conn = einvoiceConnection();
  const fields: CrudField[] = [
    { name: "code", label: "Số hóa đơn", required: true, mono: true },
    { name: "series", label: "Ký hiệu", mono: true, placeholder: "VD: 1C26TVN" },
    { name: "contractId", label: "Hợp đồng", type: "select", required: true, options: refOptions(contracts, (c) => `${c.code} · ${c.title}`) },
    { name: "issuedAt", label: "Ngày lập", type: "date" },
    { name: "amount", label: "Tiền trước thuế (VND)", type: "number" },
    { name: "vatRate", label: "Thuế GTGT (%)", type: "number", defaultValue: 8 },
    { name: "buyerName", label: "Tên người mua", full: true },
    { name: "buyerTaxCode", label: "Mã số thuế người mua", mono: true },
    { name: "status", label: "Trạng thái", type: "select", options: [...INVOICE_STATUSES] },
    { name: "buyerAddress", label: "Địa chỉ người mua", full: true },
    { name: "provider", label: "Nhà cung cấp hóa đơn", type: "select", options: [...EINVOICE_PROVIDERS] },
    { name: "lookupCode", label: "Mã tra cứu", mono: true },
    { name: "lookupUrl", label: "Trang tra cứu (https://…)", full: true },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const customerOf = (contractId: string) => customerById.get(contractById.get(contractId)?.customerId ?? "")?.name;
  const rows = [...all]
    .sort((a, b) => (b.issuedAt || "").localeCompare(a.issuedAt || "") || b.code.localeCompare(a.code))
    .filter((x) => matches(query, x.code, x.series, x.buyerName, x.buyerTaxCode, contractById.get(x.contractId)?.code, customerOf(x.contractId)));
  const issued = all.filter((x) => x.status === "Đã phát hành");
  const year = todayISO().slice(0, 4);

  return (
    <>
      <Header title="Hóa đơn điện tử" description="Hóa đơn theo hợp đồng dịch vụ; đối chiếu với các khoản thu ở trang Thanh toán" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm flex gap-2">
          <Plug className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{conn.message}</span>
        </div>
        <StatGrid
          stats={[
            { label: "Hóa đơn", value: all.length, icon: Receipt, accent: "bg-blue-50 text-blue-600" },
            { label: `Đã phát hành ${year}`, value: issued.filter((x) => (x.issuedAt || "").startsWith(year)).length, icon: FileCheck2, accent: "bg-emerald-50 text-emerald-700" },
            {
              label: `Doanh thu xuất HĐ ${year}`,
              value: fmtVND(issued.filter((x) => (x.issuedAt || "").startsWith(year)).reduce((s, x) => s + quotationTotal(x.amount, x.vatRate), 0)),
              icon: Receipt,
              accent: "bg-violet-50 text-violet-600",
              hint: "sau thuế",
            },
            { label: "Hủy / thay thế", value: all.filter((x) => x.status === "Đã hủy" || x.status === "Đã thay thế").length, icon: FileX2, accent: "bg-rose-50 text-rose-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/invoices" placeholder="Tìm số, ký hiệu, người mua, MST, hợp đồng…" />
        </div>
        <CrudTableCard
          title="Danh sách hóa đơn"
          description="Hủy / thay thế hóa đơn: đổi trạng thái, không xóa – giữ lịch sử chứng từ"
          endpoint="/api/invoices"
          entity="invoices"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/invoices" title="Nhập hóa đơn" fields={fields} addLabel="Nhập hóa đơn" />}
          headers={["Số / ký hiệu", "Hợp đồng · khách", "Người mua", "Tổng tiền", "Tra cứu", "Trạng thái"]}
          emptyText={query ? "Không có hóa đơn phù hợp" : "Chưa có hóa đơn nào"}
          rows={rows.map((x) => {
            const url = safeUrl(x.lookupUrl);
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{x.code}</div>
                  <div className="text-[11px] text-muted-foreground">{[x.series, fmtDateVN(x.issuedAt)].filter(Boolean).join(" · ")}</div>
                </div>,
                <div key="h" className="text-xs">
                  <div className="font-mono">{contractById.get(x.contractId)?.code ?? "—"}</div>
                  <div className="text-muted-foreground">{customerOf(x.contractId) ?? ""}</div>
                </div>,
                <div key="b" className="text-xs max-w-[220px]">
                  {x.buyerName || "—"}
                  {x.buyerTaxCode && <div className="text-muted-foreground font-mono">MST {x.buyerTaxCode}</div>}
                </div>,
                <div key="v" className="text-sm font-semibold whitespace-nowrap">
                  {fmtVND(quotationTotal(x.amount, x.vatRate))}
                  <div className="text-[11px] text-muted-foreground font-normal">VAT {x.vatRate}%</div>
                </div>,
                <div key="l" className="text-xs">
                  {x.lookupCode ? <span className="font-mono">{x.lookupCode}</span> : "—"}
                  {url && <div><a href={url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Mở trang tra cứu</a></div>}
                  <div className="text-muted-foreground">{x.provider}</div>
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
