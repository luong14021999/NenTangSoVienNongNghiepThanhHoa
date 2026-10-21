import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/platform/action-button";
import { ObservationImport } from "@/components/m4/knowledge/observation-import";
import { baseDatasetStore, observationsOf } from "@/lib/modules/m4/data/knowledge";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { currentAccess } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Số liệu dữ liệu nền" };

const fmt = (v: number | null) => (v == null ? "" : v.toLocaleString("vi-VN", { maximumFractionDigits: 3 }));

export default async function BaseDatasetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ind?: string }> }) {
  const { id } = await params;
  const { ind = "" } = await searchParams;
  const [datasets, obs, access] = await Promise.all([baseDatasetStore.list(), observationsOf(id), currentAccess()]);
  const d = datasets.find((x) => x.id === id);
  if (!d) notFound();
  const indicators = [...new Set(obs.map((o) => o.indicator))];
  const indicator = indicators.includes(ind) ? ind : indicators[0] ?? "";
  const sel = obs.filter((o) => o.indicator === indicator);
  const periods = [...new Set(sel.map((o) => o.period))].sort();
  const locations = [...new Set(sel.map((o) => o.location))].sort((a, b) => a.localeCompare(b, "vi"));
  const unit = sel.find((o) => o.unit)?.unit ?? "";
  const cell = new Map(sel.map((o) => [`${o.location}|${o.period}`, o.value]));
  // Biểu đồ: trung bình các địa bàn theo kỳ (tối đa 36 kỳ gần nhất).
  const chartPeriods = periods.slice(-36);
  const avg = chartPeriods.map((p) => {
    const vals = locations.map((l) => cell.get(`${l}|${p}`)).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  });
  const max = Math.max(1e-9, ...avg.map(Math.abs));
  const canWrite = access.can("write.research");
  const url = safeUrl(d.url);

  return (
    <>
      <Header title={d.title} description={`${d.code} · ${d.theme}${d.area ? ` · ${d.area}` : ""}${d.period ? ` · ${d.period}` : ""}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/base-data" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-auto">
            <ArrowLeft className="w-4 h-4" /> Dữ liệu nền
          </Link>
          {url && <a href={url} target="_blank" rel="noreferrer noopener" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent"><ExternalLink className="w-4 h-4" />Nguồn</a>}
          {canWrite && obs.length > 0 && (
            <ActionButton url={`/api/base-datasets/${id}/observations`} method="DELETE" label="Xóa toàn bộ số liệu" icon={<Trash2 />} variant="ghost" confirm={`Xóa ${obs.length} dòng số liệu của ${d.code}?`} success="Đã xóa số liệu" />
          )}
        </div>
        {d.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{d.description}{d.source && ` – Nguồn: ${d.source}`}</p>}

        {indicators.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {indicators.map((i) => (
              <Link key={i} href={`/base-data/${id}?ind=${encodeURIComponent(i)}`} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${i === indicator ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                {i}
              </Link>
            ))}
          </div>
        )}

        {sel.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{indicator}{unit && ` (${unit})`}</CardTitle>
              <CardDescription>Trung bình {locations.length} địa bàn theo kỳ{periods.length > 36 ? " – 36 kỳ gần nhất" : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-40">
                {chartPeriods.map((p, i) => (
                  <div key={p} className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end" title={`${p}: ${fmt(avg[i])} ${unit}`}>
                    <div className="w-full rounded-t bg-primary/80" style={{ height: `${(Math.abs(avg[i]) / max) * 100}%`, minHeight: avg[i] ? 2 : 0 }} />
                    <span className="text-[9px] text-muted-foreground truncate max-w-full">{p.length > 4 ? p.slice(2) : p}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Bảng số liệu</CardTitle><CardDescription>{obs.length.toLocaleString("vi-VN")} dòng · {indicators.length} chỉ tiêu</CardDescription></CardHeader>
          <CardContent>
            {sel.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có số liệu{canWrite ? " – nhập ở ô bên dưới" : ""}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="text-xs w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left font-medium px-2 py-1.5 sticky left-0 bg-muted/40">Địa bàn</th>
                      {periods.map((p) => <th key={p} className="text-right font-medium px-2 py-1.5 whitespace-nowrap">{p}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {locations.map((l) => (
                      <tr key={l}>
                        <td className="px-2 py-1 sticky left-0 bg-card whitespace-nowrap">{l || "—"}</td>
                        {periods.map((p) => <td key={p} className="px-2 py-1 text-right tabular-nums">{fmt(cell.get(`${l}|${p}`) ?? null)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {canWrite && (
          <Card>
            <CardHeader><CardTitle>Nhập số liệu</CardTitle><CardDescription>Chép bảng từ Excel (5 cột) rồi dán vào đây</CardDescription></CardHeader>
            <CardContent><ObservationImport datasetId={id} /></CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
