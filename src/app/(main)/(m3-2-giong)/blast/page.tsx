import { Trash2, Server, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/platform/action-button";
import { BlastSearchForm, HitTable, SequenceForm } from "@/components/m3/blast-forms";
import { germplasmStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { listBlastSearches, sequenceRefStore } from "@/lib/modules/m3/data/genomics";
import { blastHealth } from "@/lib/modules/m3/blast-client";
import { currentAccess } from "@/lib/platform/data/access";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đối soát trình tự (BLAST+)" };

/** M3.2.4 – BLAST+ cài cục bộ: trình tự chỉ nằm trên máy chủ nội bộ, nền tảng lưu mô tả & kết quả. */
export default async function BlastPage() {
  const [health, refs, searches, varieties, germplasm, access] = await Promise.all([
    blastHealth(),
    sequenceRefStore.list(),
    listBlastSearches(20),
    varietyStore.list(),
    germplasmStore.list(),
    currentAccess(),
  ]);
  const varietyById = byId(varieties);
  const germplasmById = byId(germplasm);
  const labelOf = Object.fromEntries(
    refs.map((r) => [r.accession, [r.gene, varietyById.get(r.varietyId)?.name, germplasmById.get(r.germplasmId)?.code].filter(Boolean).join(" · ")]),
  );
  const canWrite = access.can("write.breeding");

  return (
    <>
      <Header title="Đối soát trình tự gen (BLAST+)" description="Tra cứu, đối soát trình tự ADN/ARN/protein trên hệ thống nội bộ – không gửi dữ liệu ra máy chủ công cộng (NĐ 59/2017/NĐ-CP)" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Card className={health.connected ? "border-emerald-200" : "border-amber-200"}>
          <CardContent className="p-4 flex flex-wrap items-start gap-3 text-sm">
            <Server className={`w-5 h-5 mt-0.5 ${health.connected ? "text-emerald-600" : "text-amber-600"}`} />
            <div className="min-w-0 flex-1 space-y-1">
              {health.connected ? (
                <>
                  <div className="font-medium">Đã kết nối dịch vụ BLAST+ nội bộ <Badge variant="success" className="ml-1">{health.blast}</Badge></div>
                  <div className="text-xs text-muted-foreground">CSDL nội bộ: {health.nucl} trình tự nucleotide · {health.prot} trình tự protein</div>
                </>
              ) : (
                <>
                  <div className="font-medium">Chưa kết nối dịch vụ BLAST+ nội bộ</div>
                  <div className="text-xs text-muted-foreground">
                    {health.message !== "Chưa kết nối" && <span className="text-rose-600">{health.message}. </span>}
                    Cài dịch vụ trong thư mục <span className="font-mono">services/blast</span> (Docker, hướng dẫn trong README) trên máy chủ của Viện, rồi đặt <span className="font-mono">BLAST_SERVICE_URL</span>, <span className="font-mono">BLAST_SERVICE_TOKEN</span>. Không có chế độ mô phỏng vì kết quả đối soát giả có thể dẫn tới kết luận sai.
                  </div>
                </>
              )}
              <div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />Nền tảng chỉ lưu mã trình tự, độ dài, mã băm sha256 và bảng kết quả – không lưu trình tự.</div>
            </div>
          </CardContent>
        </Card>

        {health.connected && canWrite && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Đối soát trình tự</CardTitle><CardDescription>So trình tự mẫu với CSDL trình tự nội bộ của Viện</CardDescription></CardHeader>
              <CardContent><BlastSearchForm labelOf={labelOf} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Thêm trình tự tham chiếu</CardTitle><CardDescription>Trình tự giống, nguồn gen của Viện; trùng mã thì thay thế</CardDescription></CardHeader>
              <CardContent>
                <SequenceForm
                  varieties={varieties.map((v) => ({ id: v.id, label: `${v.code} · ${v.name}` }))}
                  germplasm={germplasm.map((g) => ({ id: g.id, label: `${g.code} · ${g.species}` }))}
                />
              </CardContent>
            </Card>
          </section>
        )}

        <Card>
          <CardHeader><CardTitle>Trình tự trong CSDL nội bộ ({refs.length})</CardTitle><CardDescription>Thông tin mô tả; nội dung trình tự chỉ có trên máy chủ BLAST</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr><th className="text-left font-medium py-1">Mã</th><th className="text-left font-medium">Loại · gen</th><th className="text-left font-medium">Giống / nguồn gen</th><th className="text-right font-medium">Độ dài</th><th className="text-left font-medium pl-3">sha256</th><th /></tr></thead>
              <tbody className="divide-y">
                {[...refs].sort((a, b) => a.accession.localeCompare(b.accession)).map((r) => (
                  <tr key={r.id}>
                    <td className="py-1.5 font-mono text-xs">{r.accession}</td>
                    <td className="text-xs">{r.molecule}{r.gene && ` · ${r.gene}`}</td>
                    <td className="text-xs">{[varietyById.get(r.varietyId)?.name, germplasmById.get(r.germplasmId)?.code].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="text-right text-xs tabular-nums">{r.length.toLocaleString("vi-VN")}</td>
                    <td className="pl-3 font-mono text-[10px] text-muted-foreground">{r.checksum.slice(0, 16)}…</td>
                    <td className="text-right">{canWrite && <ActionButton url={`/api/blast/sequences/${encodeURIComponent(r.accession)}`} method="DELETE" label="" icon={<Trash2 />} variant="ghost" confirm={`Xóa trình tự ${r.accession} khỏi CSDL BLAST nội bộ?`} success="Đã xóa" />}</td>
                  </tr>
                ))}
                {refs.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted-foreground text-xs">Chưa có trình tự</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lượt đối soát gần đây</CardTitle><CardDescription>Lưu nhãn, độ dài, mã băm truy vấn và kết quả – không lưu trình tự truy vấn</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {searches.map((s) => (
              <details key={s.id} className="rounded-lg border">
                <summary className="cursor-pointer px-3 py-2 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-xs">{s.code}</span>
                  <span>{s.queryLabel || "(không nhãn)"}</span>
                  <span className="text-xs text-muted-foreground">{s.program} · {s.queryLength} · {fmtDateTimeVN(s.createdAt)} · {s.actor}</span>
                  {s.status === "Lỗi" ? <Badge variant="destructive">Lỗi</Badge> : <Badge variant="outline">{s.hits.length} kết quả{s.hits[0] && ` · cao nhất ${s.hits[0].identity}%`}</Badge>}
                </summary>
                <div className="border-t overflow-x-auto">{s.status === "Lỗi" ? <p className="px-3 py-2 text-xs text-rose-600">{s.error}</p> : <HitTable hits={s.hits} labelOf={labelOf} />}</div>
              </details>
            ))}
            {searches.length === 0 && <p className="text-sm text-muted-foreground">Chưa có lượt đối soát</p>}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
