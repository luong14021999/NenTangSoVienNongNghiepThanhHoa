import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { cultureBatchStore, mediaBatchStore, mediaRecipeStore, recipeChemicalStore } from "@/lib/modules/m3/data/tissue";
import { CHEMICAL_UNITS } from "@/lib/modules/m3/tissue-rules";
import { contaminationRate, fmtPct } from "@/lib/modules/m3/rates";
import { mediaQcVariant } from "@/lib/modules/m3/ui";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Công thức môi trường" };

const fmtAmount = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });

/** Công thức môi trường: định mức hóa chất / lít, tính lượng cần cho 1 mẻ pha, các lô đã pha (M3.1.2). */
export default async function MediaRecipeDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params;
  const volume = Math.min(1000, Math.max(0, Number((await searchParams).v) || 1));
  const [recipes, chemicals, batches, cultures] = await Promise.all([mediaRecipeStore.list(), recipeChemicalStore.list(), mediaBatchStore.list(), cultureBatchStore.list()]);
  const r = recipes.find((x) => x.id === id);
  if (!r) notFound();
  const myChemicals = chemicals.filter((c) => c.recipeId === id).sort((a, b) => a.chemical.localeCompare(b.chemical, "vi"));
  const myBatches = batches.filter((b) => b.recipeId === id).sort((a, b) => (b.preparedAt || "").localeCompare(a.preparedAt || ""));
  const fields: CrudField[] = [
    { name: "recipeId", label: "Công thức", type: "select", options: [{ value: r.id, label: r.code }], defaultValue: r.id },
    { name: "chemical", label: "Hóa chất", required: true, placeholder: "VD: NH₄NO₃, BAP, Sucrose" },
    { name: "chemicalCode", label: "Mã trong kho (M2)", mono: true },
    { name: "amountPerL", label: "Định mức / 1 lít", type: "number", required: true },
    { name: "unit", label: "Đơn vị", type: "select", options: [...CHEMICAL_UNITS] },
    { name: "note", label: "Ghi chú (dung dịch mẹ, thứ tự pha…)", type: "textarea" },
  ];

  return (
    <>
      <Header title={`${r.code} · ${r.name}`} description={`${r.stage} · nền ${r.baseMedium} · ${r.hormones || "không chất điều hòa"} · đường ${r.sugarGl} g/l · agar ${r.agarGl} g/l · pH ${r.ph}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/media-recipes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Công thức môi trường
        </Link>

        <CrudTableCard
          title="Định mức hóa chất (trên 1 lít)"
          description="Dùng để tính lượng cần khi pha và (đợt sau) tính giá thành lô giống"
          endpoint="/api/recipe-chemicals"
          entity="recipe-chemicals"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/recipe-chemicals" title="Thêm hóa chất" fields={fields} addLabel="Thêm hóa chất" />}
          headers={["Hóa chất", "Mã kho", "Định mức / lít", "Ghi chú"]}
          emptyText="Chưa nhập định mức hóa chất"
          rows={myChemicals.map((c) => ({
            id: c.id,
            label: c.chemical,
            initial: c,
            cells: [
              <span key="n" className="text-sm">{c.chemical}</span>,
              <span key="k" className="text-xs font-mono">{c.chemicalCode || "—"}</span>,
              <span key="a" className="text-sm tabular-nums">{fmtAmount(c.amountPerL)} {c.unit}</span>,
              <span key="g" className="text-xs text-muted-foreground">{c.note || ""}</span>,
            ],
          }))}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" />Tính lượng hóa chất cho mẻ pha</CardTitle>
            <CardDescription>Nhập thể tích cần pha (lít)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form method="get" className="flex items-center gap-2">
              <input name="v" type="number" step="any" min={0} max={1000} defaultValue={volume} className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm" />
              <span className="text-sm text-muted-foreground">lít</span>
              <button className="h-9 px-3 rounded-md border bg-background text-sm hover:bg-accent">Tính</button>
            </form>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {myChemicals.map((c) => (
                  <tr key={c.id}><td className="py-1.5">{c.chemical}</td><td className="text-right tabular-nums font-medium">{fmtAmount(c.amountPerL * volume)} {c.unit}</td></tr>
                ))}
                <tr><td className="py-1.5">Đường</td><td className="text-right tabular-nums font-medium">{fmtAmount((r.sugarGl || 0) * volume)} g</td></tr>
                <tr><td className="py-1.5">Agar</td><td className="text-right tabular-nums font-medium">{fmtAmount((r.agarGl || 0) * volume)} g</td></tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Các lô đã pha</CardTitle><CardDescription>Tỷ lệ nhiễm tính trên các mẻ cấy dùng lô đó</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {myBatches.map((b) => {
                const used = cultures.filter((c) => c.mediaBatchId === b.id);
                const vessels = used.reduce((s, c) => s + c.vessels, 0);
                const contaminated = used.reduce((s, c) => s + c.contaminated, 0);
                return (
                  <li key={b.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                    <span><Link href={`/media-batches?q=${encodeURIComponent(b.code)}`} className="font-mono text-xs text-primary hover:underline">{b.code}</Link> <span className="text-xs text-muted-foreground">{fmtDateVN(b.preparedAt)} · {b.volumeL} l</span></span>
                    <span className="flex items-center gap-2 text-xs">
                      {used.length} mẻ · nhiễm {fmtPct(contaminationRate({ vessels, contaminated }))}
                      <Badge variant={mediaQcVariant[b.qcResult] ?? "secondary"}>{b.qcResult}</Badge>
                    </span>
                  </li>
                );
              })}
              {myBatches.length === 0 && <li className="py-2 text-muted-foreground">Chưa pha lô nào</li>}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
