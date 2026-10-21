import Link from "next/link";
import { Tags, Globe, Award, EyeOff } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { PRICE_CATEGORIES, priceItemStore } from "@/lib/modules/m4/data/portal";
import { fmtVND, marginPct, unitCostOf } from "@/lib/modules/m4/finance";
import { matches } from "@/lib/platform/ref-options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng giá dịch vụ" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã dịch vụ", required: true, mono: true, placeholder: "VD: DV-DAT-01" },
  { name: "category", label: "Nhóm", type: "select", options: [...PRICE_CATEGORIES] },
  { name: "name", label: "Tên dịch vụ / chỉ tiêu", required: true, full: true },
  { name: "price", label: "Đơn giá (VND, chưa gồm thuế GTGT)", type: "number" },
  { name: "unit", label: "Đơn vị tính", defaultValue: "mẫu" },
  { name: "turnaround", label: "Thời gian trả kết quả", placeholder: "VD: 7 ngày làm việc" },
  { name: "method", label: "Phương pháp / tiêu chuẩn", placeholder: "VD: TCVN 8941:2011" },
  { name: "vilas", label: "Thuộc phạm vi VILAS 1501", type: "bool", boolLabels: ["Có", "Không"], defaultValue: 0 },
  { name: "published", label: "Công bố trên cổng", type: "bool", boolLabels: ["Công bố", "Không công bố"], defaultValue: 0 },
  { name: "costMaterials", label: "Định mức: vật tư, hóa chất (VND/ĐVT)", type: "number" },
  { name: "costLabor", label: "Định mức: nhân công (VND/ĐVT)", type: "number" },
  { name: "costDepreciation", label: "Định mức: khấu hao thiết bị (VND/ĐVT)", type: "number" },
  { name: "costOverhead", label: "Định mức: quản lý, điện nước (VND/ĐVT)", type: "number" },
  { name: "note", label: "Ghi chú nội bộ", type: "textarea" },
];

export default async function PriceListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const all = (await priceItemStore.list()).sort((a, b) => a.category.localeCompare(b.category) || a.code.localeCompare(b.code));
  const query = q.trim().toLowerCase();
  const rows = all.filter((x) => matches(query, x.code, x.name, x.category, x.method));

  return (
    <>
      <Header title="Bảng giá dịch vụ" description="Đơn giá (chưa gồm thuế GTGT) và định mức chi phí; mục đánh dấu Công bố hiện trên cổng công khai (không công bố định mức)" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Dịch vụ", value: all.length, icon: Tags, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang công bố", value: all.filter((x) => x.published).length, icon: Globe, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Chưa có định mức", value: all.filter((x) => !unitCostOf(x)).length, icon: Award, accent: "bg-violet-50 text-violet-600", hint: "không tính được giá thành" },
            { label: "Chưa công bố", value: all.filter((x) => !x.published).length, icon: EyeOff, accent: "bg-slate-100 text-slate-600" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/portal#bang-gia" target="_blank" className="text-xs text-primary hover:underline">Xem bảng giá trên cổng công khai →</Link>
          <EntitySearchInput basePath="/price-list" placeholder="Tìm mã, tên, nhóm, phương pháp…" />
        </div>
        <CrudTableCard
          title="Danh sách đơn giá"
          description="Giá dùng để lập báo giá và công bố cho khách hàng"
          endpoint="/api/price-items"
          entity="price-items"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/price-items" title="Thêm dịch vụ vào bảng giá" fields={FIELDS} addLabel="Thêm dịch vụ" />}
          headers={["Mã / nhóm", "Dịch vụ", "Đơn giá", "Giá thành · tỷ suất", "Thời gian · phương pháp", "Công bố"]}
          emptyText={query ? "Không có dịch vụ phù hợp" : "Chưa có dịch vụ nào trong bảng giá"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.name,
            initial: x,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{x.code}</div>
                <div className="text-[11px] text-muted-foreground">{x.category}</div>
              </div>,
              <div key="n" className="max-w-[300px]">
                <div className="text-sm">{x.name}</div>
                {x.vilas && <Badge variant="outline" className="mt-0.5">VILAS 1501</Badge>}
              </div>,
              <span key="p" className="text-sm font-semibold whitespace-nowrap">{fmtVND(x.price)} / {x.unit}</span>,
              (() => {
                const cost = unitCostOf(x);
                const m = marginPct(x.price, cost);
                return (
                  <div key="g" className="text-xs whitespace-nowrap">
                    {cost ? fmtVND(cost) : <span className="text-muted-foreground">chưa có định mức</span>}
                    {m != null && <div className={m < 0 ? "text-rose-600 font-medium" : "text-muted-foreground"}>lãi {m.toLocaleString("vi-VN")}%</div>}
                  </div>
                );
              })(),
              <div key="t" className="text-xs">
                {x.turnaround || "—"}
                {x.method && <div className="text-muted-foreground">{x.method}</div>}
              </div>,
              <Badge key="pub" variant={x.published ? "success" : "secondary"}>{x.published ? "Công bố" : "Nội bộ"}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
