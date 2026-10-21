import Link from "next/link";
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
  cabinetStore,
  cultureBatchStore,
  growthRoomStore,
  mediaBatchStore,
  mediaRecipeStore,
  tissueMaterialStore,
  type CultureBatch,
} from "@/lib/modules/m3/data/tissue";
import { contaminationRate, fmtPct, pct } from "@/lib/modules/m3/rates";
import { batchSurvivalRate, multiplicationRate } from "@/lib/modules/m3/tissue-rules";
import { getSetting } from "@/lib/platform/data/settings";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mẻ cấy" };

const statusVariant: Record<CultureBatch["status"], "default" | "secondary" | "success" | "destructive"> = {
  "Đang nuôi": "default",
  "Đã cấy chuyển": "secondary",
  "Chuyển ra ngôi": "success",
  "Hủy": "destructive",
};

export default async function CultureBatchesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, materials, recipes, mediaBatches, cabinets, rooms, threshold] = await Promise.all([
    cultureBatchStore.list(),
    tissueMaterialStore.list(),
    mediaRecipeStore.list(),
    mediaBatchStore.list(),
    cabinetStore.list(),
    growthRoomStore.list(),
    getSetting("tissue_contamination_threshold").catch(() => 7),
  ]);
  const materialById = byId(materials);
  const recipeById = byId(recipes);
  const mediaById = byId(mediaBatches);
  const cabinetById = byId(cabinets);
  const batchById = byId(all);
  const fields: CrudField[] = [
    { name: "code", label: "Mã mẻ cấy", required: true, mono: true, placeholder: "VD: ME-2026-001" },
    { name: "stage", label: "Giai đoạn", type: "select", options: CULTURE_STAGES.filter((s) => s !== "Ra ngôi") },
    { name: "parentBatchId", label: "Cấy chuyển từ mẻ (mẻ cha)", type: "select", options: refOptions(all, (b) => `${b.code} · ${b.stage} · lần ${b.subcultureNo}`) },
    { name: "materialId", label: "Vật liệu khởi đầu (mẻ đầu tiên)", type: "select", options: refOptions(materials, (m) => `${m.code} · ${m.species} ${m.variety}`.trim()) },
    { name: "recipeId", label: "Công thức môi trường", type: "select", options: refOptions(recipes, (r) => `${r.code} · ${r.name}`) },
    { name: "mediaBatchId", label: "Lô môi trường (chỉ lô Đạt, còn hạn)", type: "select", options: refOptions(mediaBatches, (m) => `${m.code} · ${recipeById.get(m.recipeId)?.code ?? ""} · ${m.qcResult}`) },
    { name: "cabinetId", label: "Tủ cấy", type: "select", options: refOptions(cabinets, (c) => `${c.code} · ${c.name}`) },
    { name: "operator", label: "Người cấy" },
    { name: "roomId", label: "Phòng nuôi", type: "select", options: refOptions(rooms, (r) => `${r.code} · ${r.name}`) },
    { name: "room", label: "Giàn / vị trí trong phòng" },
    { name: "subcultureNo", label: "Lần cấy chuyển thứ", type: "number" },
    { name: "startedAt", label: "Ngày cấy", type: "date" },
    { name: "nextTransferAt", label: "Hẹn cấy chuyển", type: "date" },
    { name: "explants", label: "Số mẫu / chồi đưa vào", type: "number" },
    { name: "vessels", label: "Số bình cấy", type: "number" },
    { name: "contaminated", label: "Số bình nhiễm", type: "number" },
    { name: "survived", label: "Số mẫu sống cuối giai đoạn", type: "number" },
    { name: "plantlets", label: "Số chồi / cây thu được", type: "number" },
    { name: "status", label: "Trạng thái", type: "select", options: [...BATCH_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((x) =>
      matches(query, x.code, x.room, x.operator, materialById.get(x.materialId)?.species, recipeById.get(x.recipeId)?.code, mediaById.get(x.mediaBatchId)?.code, cabinetById.get(x.cabinetId)?.code),
    );
  const growing = all.filter((x) => x.status === "Đang nuôi");
  const due = growing.filter((x) => daysUntil(x.nextTransferAt) <= 3);
  const vessels = all.reduce((s, x) => s + (Number(x.vessels) || 0), 0);
  const contaminated = all.reduce((s, x) => s + (Number(x.contaminated) || 0), 0);
  const overall = pct(contaminated, vessels);

  return (
    <>
      <Header title="Mẻ cấy & cấy chuyển" description="Theo dõi mẻ cấy theo giai đoạn: số lần cấy chuyển, hệ số nhân, tỷ lệ nhiễm, tỷ lệ sống; mẻ cha – con để truy nguyên" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mẻ đang nuôi", value: growing.length, icon: Boxes, accent: "bg-blue-50 text-blue-600" },
            { label: "Đến hạn cấy chuyển", value: due.length, icon: CalendarClock, accent: "bg-amber-50 text-amber-600", hint: "quá hạn hoặc ≤ 3 ngày" },
            {
              label: "Tỷ lệ nhiễm chung",
              value: fmtPct(overall),
              icon: Bug,
              accent: overall != null && overall > threshold ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700",
              hint: `${contaminated}/${vessels} bình · ngưỡng ${threshold}%`,
            },
            { label: "Chồi / cây thu được", value: all.reduce((s, x) => s + (Number(x.plantlets) || 0), 0).toLocaleString("vi-VN"), icon: Sprout, accent: "bg-violet-50 text-violet-600" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/tissue-stats" className="text-xs text-primary hover:underline">Thống kê tỷ lệ nhiễm theo tủ cấy, người thao tác, lô môi trường →</Link>
          <EntitySearchInput basePath="/culture-batches" placeholder="Tìm mã mẻ, loài, công thức, lô môi trường, tủ cấy, người cấy…" />
        </div>
        <CrudTableCard
          title="Danh sách mẻ cấy"
          description="Mẻ cấy chuyển: chọn mẻ cha thay vì vật liệu – hệ thống tự truy ngược về vật liệu và cây mẹ"
          endpoint="/api/culture-batches"
          entity="culture-batches"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/culture-batches" title="Thêm mẻ cấy" fields={fields} addLabel="Thêm mẻ cấy" />}
          headers={["Mã / ngày cấy", "Nguồn · môi trường", "Tủ · người cấy", "Bình · nhiễm", "Hệ số nhân · sống", "Cấy chuyển", "Trạng thái"]}
          emptyText={query ? "Không có mẻ cấy phù hợp" : "Chưa có mẻ cấy nào"}
          rows={rows.map((x) => {
            const parent = batchById.get(x.parentBatchId);
            const m = materialById.get(x.materialId);
            const media = mediaById.get(x.mediaBatchId);
            const rate = contaminationRate(x);
            const mult = multiplicationRate(x);
            const survival = batchSurvivalRate(x);
            const days = daysUntil(x.nextTransferAt);
            const late = x.status === "Đang nuôi" && days <= 3;
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <Link href={`/culture-batches/${x.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{x.code}</Link>
                  <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.startedAt)} · {x.stage} · lần {x.subcultureNo}</div>
                </div>,
                <div key="m" className="text-xs">
                  {parent ? <span>từ <span className="font-mono">{parent.code}</span></span> : m ? `${m.species} ${m.variety}`.trim() : "—"}
                  <div className="text-muted-foreground font-mono">{[recipeById.get(x.recipeId)?.code, media?.code].filter(Boolean).join(" · ") || "chưa ghi môi trường"}</div>
                </div>,
                <div key="t" className="text-xs">{cabinetById.get(x.cabinetId)?.code ?? "—"}<div className="text-muted-foreground">{x.operator || "—"}</div></div>,
                <div key="v" className="text-xs whitespace-nowrap">
                  {x.vessels} bình
                  <div className={rate != null && rate > threshold ? "text-rose-600 font-medium" : "text-muted-foreground"}>nhiễm {x.contaminated} · {fmtPct(rate)}</div>
                </div>,
                <div key="h" className="text-xs whitespace-nowrap">
                  {mult == null ? "—" : `× ${mult.toLocaleString("vi-VN")}`}
                  <div className="text-muted-foreground">sống {fmtPct(survival)} · {x.plantlets} chồi</div>
                </div>,
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
