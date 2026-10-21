import { QrCode, Sprout, HeartPulse, Truck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import {
  LOT_GRADES,
  LOT_STATUSES,
  cultureBatchStore,
  mediaRecipeStore,
  seedlingLotStore,
  tissueMaterialStore,
  type SeedlingLot,
} from "@/lib/modules/m3/data/tissue";
import { fmtPct, pct, survivalRate } from "@/lib/modules/m3/rates";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lô cây giống & truy xuất" };

const statusVariant: Record<SeedlingLot["status"], "default" | "success" | "secondary" | "destructive"> = {
  "Vườn ươm": "default",
  "Đủ tiêu chuẩn xuất": "success",
  "Đã xuất": "secondary",
  "Hủy": "destructive",
};

export default async function SeedlingLotsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, batches, materials, recipes, customers] = await Promise.all([
    seedlingLotStore.list(),
    cultureBatchStore.list(),
    tissueMaterialStore.list(),
    mediaRecipeStore.list(),
    getCustomers(),
  ]);
  const batchById = byId(batches);
  const materialById = byId(materials);
  const recipeById = byId(recipes);
  const customerById = byId(customers);
  const fields: CrudField[] = [
    { name: "code", label: "Mã lô (in trên tem truy xuất)", required: true, mono: true, placeholder: "VD: LO-2026-001" },
    { name: "batchId", label: "Từ mẻ cấy", type: "select", options: refOptions(batches, (b) => `${b.code} · ${b.stage}`) },
    { name: "acclimatizedAt", label: "Ngày ra ngôi", type: "date" },
    { name: "quantity", label: "Số cây ra ngôi", type: "number" },
    { name: "survived", label: "Số cây sống", type: "number" },
    { name: "grade", label: "Phân loại", type: "select", options: ["", ...LOT_GRADES] },
    { name: "status", label: "Trạng thái", type: "select", options: [...LOT_STATUSES] },
    { name: "customerId", label: "Khách hàng nhận", type: "select", options: refOptions(customers, (c) => `${c.code} · ${c.name}`) },
    { name: "releasedAt", label: "Ngày xuất", type: "date" },
    { name: "releasedQty", label: "Số cây xuất", type: "number" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  /** Chuỗi truy xuất: lô → mẻ cấy → vật liệu khởi đầu + công thức môi trường. */
  const traceOf = (lot: SeedlingLot) => {
    const b = batchById.get(lot.batchId);
    return { batch: b, material: b && materialById.get(b.materialId), recipe: b && recipeById.get(b.recipeId) };
  };
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((x) => {
      const t = traceOf(x);
      return matches(query, x.code, t.batch?.code, t.material?.code, t.material?.species, t.material?.variety, customerById.get(x.customerId)?.name);
    });
  const planted = all.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
  const survived = all.reduce((s, x) => s + (Number(x.survived) || 0), 0);

  return (
    <>
      <Header title="Lô cây giống & truy xuất nguồn gốc" description="Ra ngôi, vườn ươm, xuất bán; mỗi lô truy ngược về mẻ cấy, công thức môi trường và vật liệu khởi đầu" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Lô cây giống", value: all.length, icon: QrCode, accent: "bg-blue-50 text-blue-600" },
            { label: "Cây đang ở vườn ươm", value: all.filter((x) => x.status === "Vườn ươm").reduce((s, x) => s + (Number(x.survived) || 0), 0).toLocaleString("vi-VN"), icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Tỷ lệ sống chung", value: fmtPct(pct(survived, planted)), icon: HeartPulse, accent: "bg-violet-50 text-violet-600", hint: `${survived}/${planted} cây` },
            { label: "Cây đã xuất", value: all.reduce((s, x) => s + (Number(x.releasedQty) || 0), 0).toLocaleString("vi-VN"), icon: Truck, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/seedling-lots" placeholder="Tìm mã lô, mã mẻ, mã vật liệu, loài, khách hàng…" />
        </div>
        <CrudTableCard
          title="Danh sách lô cây giống"
          description="Cột Truy xuất cho biết lô được tạo từ mẻ cấy, công thức và vật liệu khởi đầu nào"
          endpoint="/api/seedling-lots"
          entity="seedling-lots"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/seedling-lots" title="Thêm lô cây giống" fields={fields} addLabel="Thêm lô" />}
          headers={["Mã lô / ra ngôi", "Truy xuất", "Sống / ra ngôi", "Phân loại", "Xuất cho", "Trạng thái"]}
          emptyText={query ? "Không có lô phù hợp" : "Chưa có lô cây giống nào"}
          rows={rows.map((x) => {
            const t = traceOf(x);
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{x.code}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.acclimatizedAt)}</div>
                </div>,
                <div key="t" className="text-[11px] leading-relaxed">
                  <div className="text-sm">{t.material ? `${t.material.species} ${t.material.variety}`.trim() : "—"}</div>
                  <div className="font-mono text-muted-foreground">
                    {[t.batch?.code, t.recipe?.code, t.material?.code].filter(Boolean).join(" ← ") || "chưa gắn mẻ cấy"}
                  </div>
                </div>,
                <div key="s" className="text-xs whitespace-nowrap">
                  {x.survived}/{x.quantity}
                  <div className="text-muted-foreground">{fmtPct(survivalRate(x))}</div>
                </div>,
                <span key="g" className="text-xs">{x.grade || "—"}</span>,
                <div key="k" className="text-xs">
                  {customerById.get(x.customerId)?.name ?? "—"}
                  {x.releasedQty > 0 && <div className="text-muted-foreground">{x.releasedQty} cây · {fmtDateVN(x.releasedAt)}</div>}
                </div>,
                <Badge key="st" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
