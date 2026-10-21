import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/platform/action-button";
import { varietyStore } from "@/lib/modules/m3/data/breeding";
import { genotypeCallStore, genotypeSampleStore, markerStore } from "@/lib/modules/m3/data/genomics";
import { identifySample, profilesBySample, referenceProfiles } from "@/lib/modules/m3/genomics";
import { currentAccess } from "@/lib/platform/data/access";
import { byId } from "@/lib/platform/ref-options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mẫu ADN" };

/** Mẫu ADN (M3.2.5): hồ sơ kiểu gen, so với hồ sơ chuẩn của các giống (không tính chính mẫu này). */
export default async function GenotypeSamplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [samples, calls, markers, varieties, access] = await Promise.all([
    genotypeSampleStore.list(),
    genotypeCallStore.list(),
    markerStore.list(),
    varietyStore.list(),
    currentAccess(),
  ]);
  const s = samples.find((x) => x.id === id);
  if (!s) notFound();
  const markerById = byId(markers);
  const varietyById = byId(varieties);
  const myCalls = calls
    .filter((c) => c.sampleId === id)
    .sort((a, b) => (markerById.get(a.markerId)?.code ?? "").localeCompare(markerById.get(b.markerId)?.code ?? ""));
  const profiles = profilesBySample(calls);
  const refs = referenceProfiles(samples.filter((x) => x.id !== id), profiles);
  const ranking = identifySample(
    profiles.get(id) ?? new Map(),
    [...refs.entries()].map(([vid, profile]) => ({ id: vid, label: varietyById.get(vid)?.name ?? vid, profile })),
  );

  return (
    <>
      <Header title={`Mẫu ADN ${s.code}`} description={`${s.purpose}${varietyById.get(s.varietyId) ? ` · ${varietyById.get(s.varietyId)!.name}` : ""}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/genotypes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Mẫu ADN & kiểu gen
        </Link>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Hồ sơ kiểu gen ({myCalls.length} chỉ thị)</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground"><tr><th className="text-left font-medium py-1">Chỉ thị</th><th className="text-left font-medium">Loại</th><th className="text-left font-medium">Kiểu gen</th><th /></tr></thead>
                <tbody className="divide-y">
                  {myCalls.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1 font-mono text-xs">{markerById.get(c.markerId)?.code}</td>
                      <td className="text-xs">{markerById.get(c.markerId)?.kind}</td>
                      <td className="font-mono text-xs">
                        {c.allele1}/{c.allele2 || c.allele1}
                        {!c.allele2 || c.allele2 === c.allele1 ? <span className="text-muted-foreground"> (đồng hợp)</span> : null}
                      </td>
                      <td className="text-right">{access.can("write.breeding") && <ActionButton url={`/api/genotype-calls/${c.id}`} method="DELETE" label="" icon={<Trash2 />} variant="ghost" success="Đã xóa" />}</td>
                    </tr>
                  ))}
                  {myCalls.length === 0 && <tr><td colSpan={4} className="py-3 text-xs text-muted-foreground">Chưa có kiểu gen – nhập ở trang Mẫu ADN & kiểu gen</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>So với giống tham chiếu</CardTitle><CardDescription>Độ tương đồng = tỷ lệ alen chung trung bình trên các chỉ thị cùng có số liệu</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {ranking.slice(0, 10).map((r) => (
                  <li key={r.ref.id} className="py-1.5 flex flex-wrap justify-between gap-2">
                    <span>{r.ref.label}</span>
                    <span className="text-xs">
                      {r.similarity == null ? "—" : `${Math.round(r.similarity * 1000) / 10}%`} · {r.identical}/{r.compared} chỉ thị trùng ·{" "}
                      <Badge variant={r.conclusion === "Trùng khớp" ? "success" : r.conclusion === "Khác giống" ? "destructive" : "secondary"}>{r.conclusion}</Badge>
                    </span>
                  </li>
                ))}
                {ranking.length === 0 && <li className="py-1.5 text-xs text-muted-foreground">Chưa có giống nào có hồ sơ chuẩn (mẫu Giống tham chiếu)</li>}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
