import Link from "next/link";
import { Bug, Target, AlertTriangle, Thermometer } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/common/stat-grid";
import {
  cabinetStore,
  cultureBatchStore,
  growthRoomStore,
  latestReadings,
  mediaBatchStore,
  mediaRecipeStore,
  motherPlantStore,
  tissueMaterialStore,
} from "@/lib/modules/m3/data/tissue";
import { fmtPct, pct } from "@/lib/modules/m3/rates";
import { MIN_VESSELS_FOR_CONCLUSION, contaminationBy, lineage, readingAlerts, type ContaminationGroup } from "@/lib/modules/m3/tissue-rules";
import { getSetting } from "@/lib/platform/data/settings";
import { byId } from "@/lib/platform/ref-options";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thống kê tỷ lệ nhiễm" };

/** Bảng tỷ lệ nhiễm theo 1 tiêu chí, có vạch ngưỡng. */
function GroupTable({ title, description, groups, threshold }: { title: string; description: string; groups: ContaminationGroup[]; threshold: number }) {
  const max = Math.max(threshold * 2, ...groups.map((g) => g.rate ?? 0));
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có dữ liệu</p>
        ) : (
          <ul className="space-y-2.5">
            {groups.map((g) => (
              <li key={g.key}>
                <div className="flex items-center justify-between gap-2 text-sm mb-1">
                  <span className="truncate">{g.key}</span>
                  <span className={`text-xs whitespace-nowrap ${g.overThreshold ? "text-rose-600 font-semibold" : "text-muted-foreground"}`}>
                    {fmtPct(g.rate)} · {g.contaminated}/{g.vessels} bình · {g.batches} mẻ
                    {g.smallSample && <span className="text-amber-600"> · ít mẫu</span>}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${g.overThreshold ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, ((g.rate ?? 0) / max) * 100)}%` }} />
                  <div className="absolute top-0 bottom-0 w-px bg-foreground/60" style={{ left: `${(threshold / max) * 100}%` }} title={`Ngưỡng ${threshold}%`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** M3.1.4 – tỷ lệ nhiễm theo tủ cấy, người thao tác, lô môi trường…; cảnh báo vượt ngưỡng; điều kiện phòng nuôi. */
export default async function TissueStatsPage({ searchParams }: { searchParams: Promise<{ months?: string }> }) {
  const months = [3, 6, 12, 24].includes(Number((await searchParams).months)) ? Number((await searchParams).months) : 6;
  const [batches, cabinets, mediaBatches, recipes, materials, mothers, rooms, latest, threshold] = await Promise.all([
    cultureBatchStore.list(),
    cabinetStore.list(),
    mediaBatchStore.list(),
    mediaRecipeStore.list(),
    tissueMaterialStore.list(),
    motherPlantStore.list(),
    growthRoomStore.list(),
    latestReadings(),
    getSetting("tissue_contamination_threshold").catch(() => 7),
  ]);
  const today = todayISO();
  const from = new Date(Date.parse(today) - months * 30.44 * 86_400_000).toISOString().slice(0, 10);
  const inRange = batches.filter((b) => b.status !== "Hủy" && (!b.startedAt || b.startedAt >= from));
  const cabinetById = byId(cabinets);
  const mediaById = byId(mediaBatches);
  const recipeById = byId(recipes);
  const materialById = byId(materials);
  const motherById = byId(mothers);
  /** Cây mẹ gốc của mẻ (qua chuỗi mẻ cha → vật liệu). */
  const motherOf = (id: string) => {
    const chain = lineage(id, batches);
    const m = materialById.get(chain[chain.length - 1]?.materialId ?? "");
    const mp = m ? motherById.get(m.motherPlantId) : undefined;
    return mp ? `${mp.code} · ${mp.species} ${mp.variety}`.trim() : "";
  };

  const vessels = inRange.reduce((s, b) => s + b.vessels, 0);
  const contaminated = inRange.reduce((s, b) => s + b.contaminated, 0);
  const overall = pct(contaminated, vessels);
  const byCabinet = contaminationBy(inRange, (b) => (cabinetById.get(b.cabinetId) ? `${cabinetById.get(b.cabinetId)!.code} · ${cabinetById.get(b.cabinetId)!.name}` : ""), threshold);
  const byOperator = contaminationBy(inRange, (b) => b.operator, threshold);
  const byMedia = contaminationBy(inRange, (b) => mediaById.get(b.mediaBatchId)?.code ?? "", threshold);
  const byRecipe = contaminationBy(inRange, (b) => (recipeById.get(b.recipeId) ? `${recipeById.get(b.recipeId)!.code} · ${recipeById.get(b.recipeId)!.name}` : ""), threshold);
  const byStage = contaminationBy(inRange, (b) => b.stage, threshold);
  const byMother = contaminationBy(inRange, (b) => motherOf(b.id), threshold);
  const byMonth = contaminationBy(inRange, (b) => (b.startedAt || "").slice(0, 7), threshold).sort((a, b) => a.key.localeCompare(b.key));
  const flagged = [
    ...byCabinet.filter((g) => g.overThreshold && !g.smallSample).map((g) => ({ dim: "Tủ cấy", ...g })),
    ...byOperator.filter((g) => g.overThreshold && !g.smallSample).map((g) => ({ dim: "Người thao tác", ...g })),
    ...byMedia.filter((g) => g.overThreshold && !g.smallSample).map((g) => ({ dim: "Lô môi trường", ...g })),
    ...byMother.filter((g) => g.overThreshold && !g.smallSample).map((g) => ({ dim: "Cây mẹ", ...g })),
  ];
  const roomIssues = rooms.map((r) => ({ r, last: latest.get(r.id) })).filter((x) => x.last && readingAlerts(x.r, x.last).length > 0);

  return (
    <>
      <Header title="Thống kê tỷ lệ nhiễm" description="Xác định nguyên nhân nhiễm mẫu theo tủ cấy, người thao tác, lô môi trường, cây mẹ – mục tiêu đưa tỷ lệ nhiễm về 5–7%" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {[3, 6, 12, 24].map((m) => (
            <Link key={m} href={`/tissue-stats?months=${m}`} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${m === months ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
              {m} tháng
            </Link>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">Ngưỡng cảnh báo {threshold}% – sửa ở <Link href="/settings" className="text-primary hover:underline">Cấu hình (M1)</Link></span>
        </div>
        <StatGrid
          stats={[
            { label: `Tỷ lệ nhiễm ${months} tháng`, value: fmtPct(overall), icon: Bug, accent: overall != null && overall > threshold ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700", hint: `${contaminated}/${vessels} bình · ${inRange.length} mẻ` },
            { label: "Mục tiêu kỹ thuật", value: "5–7%", icon: Target, accent: "bg-blue-50 text-blue-600", hint: `ngưỡng cảnh báo ${threshold}%` },
            { label: "Nhóm vượt ngưỡng", value: flagged.length, icon: AlertTriangle, accent: "bg-amber-50 text-amber-600", hint: `đủ ≥ ${MIN_VESSELS_FOR_CONCLUSION} bình để kết luận` },
            { label: "Phòng nuôi ngoài ngưỡng", value: roomIssues.length, icon: Thermometer, accent: "bg-violet-50 text-violet-600", hint: "theo lần đo mới nhất" },
          ]}
        />

        {(flagged.length > 0 || roomIssues.length > 0) && (
          <Card className="border-rose-200">
            <CardHeader><CardTitle className="text-rose-700">Cảnh báo cần xử lý</CardTitle><CardDescription>Nhóm có tỷ lệ nhiễm vượt ngưỡng (đủ số bình để kết luận) và phòng nuôi ngoài điều kiện</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {flagged.map((f) => (
                  <li key={`${f.dim}-${f.key}`} className="py-1.5 flex flex-wrap justify-between gap-2">
                    <span><Badge variant="outline" className="mr-2">{f.dim}</Badge>{f.key}</span>
                    <span className="text-rose-600 font-medium text-xs">{fmtPct(f.rate)} · {f.contaminated}/{f.vessels} bình</span>
                  </li>
                ))}
                {roomIssues.map(({ r, last }) => (
                  <li key={r.id} className="py-1.5 flex flex-wrap justify-between gap-2">
                    <span><Badge variant="outline" className="mr-2">Phòng nuôi</Badge><Link href={`/growth-rooms/${r.id}`} className="hover:underline">{r.code} · {r.name}</Link></span>
                    <span className="text-rose-600 text-xs">{readingAlerts(r, last!).map((a) => `${a.field} ${a.value} (${a.limit})`).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <GroupTable title="Theo tháng" description="Xu hướng tỷ lệ nhiễm theo ngày cấy" groups={byMonth} threshold={threshold} />
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GroupTable title="Theo tủ cấy" description="Cao bất thường: kiểm tra màng lọc HEPA, đèn UV, vệ sinh tủ" groups={byCabinet} threshold={threshold} />
          <GroupTable title="Theo người thao tác" description="Cao bất thường: rà soát thao tác vô trùng, đào tạo lại" groups={byOperator} threshold={threshold} />
          <GroupTable title="Theo lô môi trường" description="Cao bất thường: kiểm tra pha chế, hấp tiệt trùng, bảo quản" groups={byMedia} threshold={threshold} />
          <GroupTable title="Theo cây mẹ (nguồn vật liệu)" description="Cao bất thường: nhiễm nội sinh – kiểm tra lại sạch bệnh, khử trùng mẫu" groups={byMother} threshold={threshold} />
          <GroupTable title="Theo công thức môi trường" description="So sánh giữa các công thức" groups={byRecipe} threshold={threshold} />
          <GroupTable title="Theo giai đoạn" description="Khởi đầu thường cao hơn nhân nhanh, ra rễ" groups={byStage} threshold={threshold} />
        </section>
      </main>
    </>
  );
}
