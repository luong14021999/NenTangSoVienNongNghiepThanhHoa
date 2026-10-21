import { Boxes, CalendarClock, Bug, Sprout } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import {
  BATCH_STATUSES,
  CULTURE_STAGES,
  cultureBatchStore,
  mediaRecipeStore,
  tissueMaterialStore,
  type CultureBatch,
} from "@/lib/modules/m3/data/tissue";
import { contaminationRate, fmtPct, pct } from "@/lib/modules/m3/rates";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mẻ cấy" };

/** Tỷ lệ nhiễm từ mức này trở lên được tô đỏ. */
const CONTAMINATION_WARN = 10;

const statusVariant: Record<CultureBatch["status"], "default" | "secondary" | "success" | "destructive"> = {
  "Đang nuôi": "default",
  "Đã cấy chuyển": "secondary",
  "Chuyển ra ngôi": "success",
  "Hủy": "destructive",
};

export default async function CultureBatchesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, materials, recipes] = await Promise.all([cultureBatchStore.list(), tissueMaterialStore.list(), mediaRecipeStore.list()]);
  const materialById = byId(materials);
  const recipeById = byId(recipes);
  const fields: CrudField[] = [
    { name: "code", label: "Mã mẻ cấy", required: true, mono: true, placeholder: "VD: ME-2026-001" },
    { name: "materialId", label: "Vật liệu khởi đầu", type: "select", options: refOptions(materials, (m) => `${m.code} · ${m.species} ${m.variety}`.trim()) },
    { name: "recipeId", label: "Công thức môi trường", type: "select", options: refOptions(recipes, (r) => `${r.code} · ${r.name}`) },
    { name: "stage", label: "Giai đoạn", type: "select", options: CULTURE_STAGES.filter((s) => s !== "Ra ngôi") },
    { name: "subcultureNo", label: "Lần cấy chuyển thứ", type: "number" },
    { name: "startedAt", label: "Ngày cấy", type: "date" },
    { name: "nextTransferAt", label: "Hẹn cấy chuyển", type: "date" },
    { name: "vessels", label: "Số bình cấy", type: "number" },
    { name: "contaminated", label: "Số bình nhiễm", type: "number" },
    { name: "plantlets", label: "Số chồi / cây thu được", type: "number" },
    { name: "room", label: "Phòng nuôi / giàn" },
    { name: "operator", label: "Người cấy" },
    { name: "status", label: "Trạng thái", type: "select", options: [...BATCH_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((x) => matches(query, x.code, x.room, x.operator, materialById.get(x.materialId)?.species, recipeById.get(x.recipeId)?.code));
  const growing = all.filter((x) => x.status === "Đang nuôi");
  const due = growing.filter((x) => daysUntil(x.nextTransferAt) <= 3);
  const vessels = all.reduce((s, x) => s + (Number(x.vessels) || 0), 0);
  const contaminated = all.reduce((s, x) => s + (Number(x.contaminated) || 0), 0);

  return (
    <>
      <Header title="Mẻ cấy & cấy chuyển" description="Theo dõi mẻ cấy theo giai đoạn, lịch cấy chuyển, tỷ lệ nhiễm và số chồi thu được" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mẻ đang nuôi", value: growing.length, icon: Boxes, accent: "bg-blue-50 text-blue-600" },
            { label: "Đến hạn cấy chuyển", value: due.length, icon: CalendarClock, accent: "bg-amber-50 text-amber-600", hint: "quá hạn hoặc ≤ 3 ngày" },
            { label: "Tỷ lệ nhiễm chung", value: fmtPct(pct(contaminated, vessels)), icon: Bug, accent: "bg-rose-50 text-rose-600", hint: `${contaminated}/${vessels} bình` },
            { label: "Chồi / cây thu được", value: all.reduce((s, x) => s + (Number(x.plantlets) || 0), 0).toLocaleString("vi-VN"), icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/culture-batches" placeholder="Tìm mã mẻ, loài, công thức, phòng, người cấy…" />
        </div>
        <CrudTableCard
          title="Danh sách mẻ cấy"
          description="Mẻ chuyển ra ngôi tạo thành lô cây giống ở trang Lô cây giống & truy xuất"
          endpoint="/api/culture-batches"
          entity="culture-batches"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/culture-batches" title="Thêm mẻ cấy" fields={fields} addLabel="Thêm mẻ cấy" />}
          headers={["Mã / ngày cấy", "Vật liệu · công thức", "Giai đoạn", "Bình · nhiễm", "Chồi", "Cấy chuyển", "Trạng thái"]}
          emptyText={query ? "Không có mẻ cấy phù hợp" : "Chưa có mẻ cấy nào"}
          rows={rows.map((x) => {
            const m = materialById.get(x.materialId);
            const r = recipeById.get(x.recipeId);
            const rate = contaminationRate(x);
            const days = daysUntil(x.nextTransferAt);
            const late = x.status === "Đang nuôi" && days <= 3;
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{x.code}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.startedAt)}</div>
                </div>,
                <div key="m">
                  <div className="text-sm">{m ? `${m.species} ${m.variety}`.trim() : "—"}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{[m?.code, r?.code].filter(Boolean).join(" · ") || "—"}</div>
                </div>,
                <span key="g" className="text-xs whitespace-nowrap">{x.stage} · lần {x.subcultureNo}</span>,
                <div key="v" className="text-xs whitespace-nowrap">
                  {x.vessels} bình
                  <div className={rate != null && rate >= CONTAMINATION_WARN ? "text-rose-600 font-medium" : "text-muted-foreground"}>
                    nhiễm {x.contaminated} · {fmtPct(rate)}
                  </div>
                </div>,
                <span key="p" className="text-sm font-semibold">{x.plantlets}</span>,
                <span key="n" className={`text-xs ${late ? "text-rose-600 font-medium" : ""}`}>
                  {fmtDateVN(x.nextTransferAt) || "—"}
                  {late && (days < 0 ? ` · quá ${-days} ngày` : ` · còn ${days} ngày`)}
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
