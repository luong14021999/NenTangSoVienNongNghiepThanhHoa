import Link from "next/link";
import { Beaker, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { cultureBatchStore, mediaBatchStore, mediaRecipeStore } from "@/lib/modules/m3/data/tissue";
import { MEDIA_QC_RESULTS } from "@/lib/modules/m3/tissue-rules";
import { contaminationRate, fmtPct } from "@/lib/modules/m3/rates";
import { mediaQcVariant } from "@/lib/modules/m3/ui";
import { getSetting } from "@/lib/platform/data/settings";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateTimeVN, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lô môi trường" };

export default async function MediaBatchesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, recipes, cultures, threshold] = await Promise.all([
    mediaBatchStore.list(),
    mediaRecipeStore.list(),
    cultureBatchStore.list(),
    getSetting("tissue_contamination_threshold").catch(() => 7),
  ]);
  const recipeById = byId(recipes);
  const fields: CrudField[] = [
    { name: "code", label: "Mã lô môi trường", required: true, mono: true, placeholder: "VD: LMT-2026-001" },
    { name: "recipeId", label: "Công thức", type: "select", required: true, options: refOptions(recipes, (r) => `${r.code} · ${r.name}`) },
    { name: "preparedAt", label: "Ngày pha", type: "date" },
    { name: "preparedBy", label: "Người pha" },
    { name: "volumeL", label: "Thể tích (lít)", type: "number" },
    { name: "vessels", label: "Số bình / ống đã rót", type: "number" },
    { name: "phMeasured", label: "pH đo được (trước hấp)", type: "number" },
    { name: "autoclaveAt", label: "Thời điểm hấp", type: "datetime-local" },
    { name: "autoclaveTempC", label: "Nhiệt độ hấp (°C)", type: "number", defaultValue: 121 },
    { name: "autoclaveMinutes", label: "Thời gian hấp (phút)", type: "number", defaultValue: 20 },
    { name: "qcResult", label: "Kiểm tra chất lượng", type: "select", options: [...MEDIA_QC_RESULTS] },
    { name: "expiresAt", label: "Hạn sử dụng", type: "date" },
    { name: "qcNote", label: "Nhận xét kiểm tra (ủ thử, độ đông, màu…)", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => (b.preparedAt || "").localeCompare(a.preparedAt || "") || b.code.localeCompare(a.code))
    .filter((x) => matches(query, x.code, x.preparedBy, recipeById.get(x.recipeId)?.code, recipeById.get(x.recipeId)?.name));
  const count = (s: string) => all.filter((x) => x.qcResult === s).length;

  return (
    <>
      <Header title="Lô môi trường" description="Pha chế, hấp tiệt trùng và kiểm tra chất lượng theo lô – chỉ lô Đạt, còn hạn mới được dùng cho mẻ cấy" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Lô đã pha", value: all.length, icon: Beaker, accent: "bg-blue-50 text-blue-600" },
            { label: "Chờ kiểm tra", value: count("Chờ kiểm tra"), icon: Clock, accent: "bg-amber-50 text-amber-600" },
            { label: "Đạt", value: count("Đạt"), icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Không đạt", value: count("Không đạt"), icon: XCircle, accent: "bg-rose-50 text-rose-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/media-batches" placeholder="Tìm mã lô, công thức, người pha…" />
        </div>
        <CrudTableCard
          title="Danh sách lô môi trường"
          description={`Tỷ lệ nhiễm của các mẻ cấy dùng lô; vượt ${threshold}% (ngưỡng Viện quy định) được tô đỏ`}
          endpoint="/api/media-batches"
          entity="media-batches"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/media-batches" title="Ghi lô môi trường" fields={fields} addLabel="Ghi lô pha" />}
          headers={["Mã / ngày pha", "Công thức", "Pha · hấp", "Kiểm tra", "Hạn dùng", "Mẻ cấy dùng lô"]}
          emptyText={query ? "Không có lô phù hợp" : "Chưa có lô môi trường nào"}
          rows={rows.map((x) => {
            const r = recipeById.get(x.recipeId);
            const used = cultures.filter((c) => c.mediaBatchId === x.id);
            const rate = contaminationRate({ vessels: used.reduce((s, c) => s + c.vessels, 0), contaminated: used.reduce((s, c) => s + c.contaminated, 0) });
            const left = daysUntil(x.expiresAt);
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{x.code}</div><div className="text-[11px] text-muted-foreground">{fmtDateVN(x.preparedAt)} · {x.preparedBy || "—"}</div></div>,
                <div key="r" className="text-xs">{r ? <Link href={`/media-recipes/${r.id}`} className="font-mono text-primary hover:underline">{r.code}</Link> : "—"}<div className="text-muted-foreground">{r?.name}</div></div>,
                <div key="p" className="text-xs whitespace-nowrap">
                  {x.volumeL} l · {x.vessels} bình{x.phMeasured ? ` · pH ${x.phMeasured}` : ""}
                  <div className="text-muted-foreground">{x.autoclaveTempC ? `${x.autoclaveTempC}°C × ${x.autoclaveMinutes} phút` : "chưa ghi hấp"}{x.autoclaveAt && ` · ${fmtDateTimeVN(x.autoclaveAt)}`}</div>
                </div>,
                <div key="q" className="text-xs max-w-[200px]"><Badge variant={mediaQcVariant[x.qcResult] ?? "secondary"}>{x.qcResult}</Badge><div className="text-muted-foreground mt-0.5">{clip(x.qcNote || "", 60)}</div></div>,
                <span key="h" className={`text-xs ${Number.isFinite(left) && left < 0 ? "text-rose-600 font-medium" : ""}`}>{fmtDateVN(x.expiresAt) || "—"}{Number.isFinite(left) && left < 0 && " · hết hạn"}</span>,
                <span key="u" className={`text-xs ${rate != null && rate > threshold ? "text-rose-600 font-medium" : ""}`}>{used.length} mẻ · nhiễm {fmtPct(rate)}</span>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
