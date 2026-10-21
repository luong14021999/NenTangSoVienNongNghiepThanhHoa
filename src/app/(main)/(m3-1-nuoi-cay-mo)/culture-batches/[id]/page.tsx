import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TreeDeciduous, Leaf, Boxes, QrCode } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cabinetStore,
  cultureBatchStore,
  mediaBatchStore,
  mediaRecipeStore,
  motherPlantStore,
  seedlingLotStore,
  tissueMaterialStore,
} from "@/lib/modules/m3/data/tissue";
import { contaminationRate, fmtPct } from "@/lib/modules/m3/rates";
import { batchSurvivalRate, lineage, multiplicationRate } from "@/lib/modules/m3/tissue-rules";
import { diseaseVariant } from "@/lib/modules/m3/ui";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Truy nguyên mẻ cấy" };

/** Chuỗi truy nguyên của 1 mẻ: cây mẹ → vật liệu → các mẻ cấy chuyển → mẻ này → mẻ con, lô ra ngôi (M3.1.3). */
export default async function CultureBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [batches, materials, mothers, recipes, mediaBatches, cabinets, lots] = await Promise.all([
    cultureBatchStore.list(),
    tissueMaterialStore.list(),
    motherPlantStore.list(),
    mediaRecipeStore.list(),
    mediaBatchStore.list(),
    cabinetStore.list(),
    seedlingLotStore.list(),
  ]);
  const b = batches.find((x) => x.id === id);
  if (!b) notFound();
  const chain = lineage(id, batches); // [mẻ này, mẻ cha, …, mẻ đầu]
  const root = chain[chain.length - 1];
  const material = materials.find((m) => m.id === root.materialId);
  const mother = material ? mothers.find((m) => m.id === material.motherPlantId) : undefined;
  const recipeById = byId(recipes);
  const mediaById = byId(mediaBatches);
  const cabinetById = byId(cabinets);
  const children = batches.filter((x) => x.parentBatchId === id);
  const myLots = lots.filter((l) => l.batchId === id);
  const brokenChain = chain.length > 1 && !root.materialId;

  return (
    <>
      <Header title={`Mẻ ${b.code}`} description={`${b.stage} · cấy chuyển lần ${b.subcultureNo} · ${fmtDateVN(b.startedAt)}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/culture-batches" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Mẻ cấy
        </Link>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Tỷ lệ nhiễm", fmtPct(contaminationRate(b)), `${b.contaminated}/${b.vessels} bình`],
            ["Hệ số nhân", multiplicationRate(b) == null ? "—" : `× ${multiplicationRate(b)!.toLocaleString("vi-VN")}`, `${b.plantlets} chồi / ${b.explants} mẫu`],
            ["Tỷ lệ sống", fmtPct(batchSurvivalRate(b)), `${b.survived}/${b.explants} mẫu`],
            ["Tủ · người cấy", cabinetById.get(b.cabinetId)?.code ?? "—", b.operator || "—"],
          ].map(([label, value, hint]) => (
            <Card key={label}><CardContent className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-semibold mt-1">{value}</div><div className="text-[11px] text-muted-foreground">{hint}</div></CardContent></Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Chuỗi truy nguyên</CardTitle>
            <CardDescription>Từ cây mẹ đến mẻ hiện tại{brokenChain && " – mẻ đầu tiên chưa gắn vật liệu khởi đầu, chuỗi bị đứt"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l-2 border-primary/30 ml-3 space-y-3">
              <li className="ml-6">
                <span className="absolute -left-[13px] w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><TreeDeciduous className="w-3.5 h-3.5" /></span>
                <div className="text-sm">
                  <span className="font-medium">Cây mẹ </span>
                  {mother ? (
                    <><Link href={`/mother-plants?q=${encodeURIComponent(mother.code)}`} className="font-mono text-primary hover:underline">{mother.code}</Link> · {mother.species} {mother.variety} <Badge variant={diseaseVariant[mother.diseaseStatus] ?? "secondary"}>{mother.diseaseStatus}</Badge></>
                  ) : <span className="text-amber-600">chưa gắn cây mẹ</span>}
                </div>
              </li>
              <li className="ml-6">
                <span className="absolute -left-[13px] w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Leaf className="w-3.5 h-3.5" /></span>
                <div className="text-sm">
                  <span className="font-medium">Vật liệu khởi đầu </span>
                  {material ? <><span className="font-mono">{material.code}</span> · {material.explantType} · {fmtDateVN(material.collectedAt)}</> : <span className="text-amber-600">chưa gắn</span>}
                </div>
              </li>
              {[...chain].reverse().map((x) => (
                <li key={x.id} className="ml-6">
                  <span className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${x.id === id ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"}`}><Boxes className="w-3.5 h-3.5" /></span>
                  <div className="text-sm">
                    {x.id === id ? <span className="font-mono font-semibold">{x.code}</span> : <Link href={`/culture-batches/${x.id}`} className="font-mono text-primary hover:underline">{x.code}</Link>}
                    <span className="text-muted-foreground"> · {x.stage} · lần {x.subcultureNo} · {fmtDateVN(x.startedAt)}</span>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {[recipeById.get(x.recipeId)?.code, mediaById.get(x.mediaBatchId)?.code, cabinetById.get(x.cabinetId)?.code, x.operator].filter(Boolean).join(" · ")} · nhiễm {fmtPct(contaminationRate(x))}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Mẻ con (cấy chuyển tiếp)</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {children.map((c) => (
                  <li key={c.id} className="py-1.5 flex justify-between gap-2"><Link href={`/culture-batches/${c.id}`} className="font-mono text-xs text-primary hover:underline">{c.code}</Link><span className="text-xs text-muted-foreground">{c.stage} · {fmtDateVN(c.startedAt)} · nhiễm {fmtPct(contaminationRate(c))}</span></li>
                ))}
                {children.length === 0 && <li className="py-1.5 text-muted-foreground text-xs">Chưa có</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="w-4 h-4" />Lô ra ngôi</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {myLots.map((l) => (
                  <li key={l.id} className="py-1.5 flex justify-between gap-2"><Link href={`/trace/${encodeURIComponent(l.code)}`} target="_blank" className="font-mono text-xs text-primary hover:underline">{l.code}</Link><span className="text-xs text-muted-foreground">{l.survived}/{l.quantity} cây · {l.status}</span></li>
                ))}
                {myLots.length === 0 && <li className="py-1.5 text-muted-foreground text-xs">Chưa có</li>}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
