"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const field = "h-9 rounded-md border border-input bg-background px-2 text-sm";
const area = "w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono";

type Opt = { id: string; label: string };

/** Thêm trình tự vào CSDL BLAST nội bộ (trình tự chỉ đi tới máy chủ BLAST, nền tảng lưu độ dài + mã băm). */
export function SequenceForm({ varieties, germplasm }: { varieties: Opt[]; germplasm: Opt[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    const res = await fetch("/api/blast/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không thêm được", data.error ?? `HTTP ${res.status}`);
    toast.success(`Đã thêm ${data.item.accession} (${data.item.length})`);
    form.reset();
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <input name="accession" required maxLength={64} pattern="[A-Za-z0-9._-]{1,64}" placeholder="Mã trình tự" className={`${field} font-mono`} />
        <select name="molecule" className={field} defaultValue="ADN"><option>ADN</option><option>ARN</option><option>Protein</option></select>
        <input name="gene" maxLength={60} placeholder="Gen / vùng (ITS, matK…)" className={field} />
        <select name="varietyId" className={field} defaultValue=""><option value="">— Giống —</option>{varieties.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select>
        <select name="germplasmId" className={field} defaultValue=""><option value="">— Nguồn gen —</option>{germplasm.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
      </div>
      <textarea name="sequence" required rows={4} placeholder=">tieu_de (tùy chọn)&#10;ACGTACGT…" className={area} />
      <Button type="submit" size="sm" disabled={busy || pending}>{busy || pending ? <Loader2 className="animate-spin" /> : <Plus />} Thêm vào CSDL nội bộ</Button>
    </form>
  );
}

type Hit = { accession: string; identity: number; length: number; mismatches: number; gaps: number; evalue: number; bitscore: number; queryCoverage: number };

/** Đối soát trình tự trên dịch vụ BLAST nội bộ. */
export function BlastSearchForm({ labelOf }: { labelOf: Record<string, string> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; queryLength: number; hits: Hit[] } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/blast/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget).entries())),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không đối soát được", data.error ?? `HTTP ${res.status}`);
    setResult(data);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input name="label" maxLength={200} placeholder="Nhãn mẫu truy vấn" className={field} />
          <select name="program" className={field} defaultValue="blastn"><option value="blastn">blastn (nucleotide)</option><option value="blastp">blastp (protein)</option></select>
          <select name="evalue" className={field} defaultValue="0.00001"><option value="0.001">E ≤ 1e-3</option><option value="0.00001">E ≤ 1e-5</option><option value="1e-10">E ≤ 1e-10</option><option value="1e-50">E ≤ 1e-50</option></select>
          <select name="maxHits" className={field} defaultValue="20"><option value="5">5 kết quả</option><option value="20">20 kết quả</option><option value="100">100 kết quả</option></select>
        </div>
        <textarea name="query" required rows={4} placeholder="Dán trình tự truy vấn (FASTA hoặc chuỗi)" className={area} />
        <Button type="submit" size="sm" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Search />} Đối soát</Button>
      </form>
      {result && (
        <div className="rounded-lg border overflow-x-auto">
          <div className="px-3 py-2 text-xs text-muted-foreground border-b">Lượt <span className="font-mono">{result.code}</span> · truy vấn {result.queryLength} · {result.hits.length} kết quả</div>
          <HitTable hits={result.hits} labelOf={labelOf} />
        </div>
      )}
    </div>
  );
}

export function HitTable({ hits, labelOf }: { hits: Hit[]; labelOf: Record<string, string> }) {
  if (!hits.length) return <p className="px-3 py-3 text-sm text-muted-foreground">Không có trình tự tương đồng trong CSDL nội bộ ở ngưỡng E đã chọn.</p>;
  return (
    <table className="w-full text-xs">
      <thead className="bg-muted/40 text-muted-foreground"><tr><th className="text-left font-medium px-3 py-1.5">Trình tự</th><th className="text-right font-medium px-3">% giống</th><th className="text-right font-medium px-3">Độ phủ</th><th className="text-right font-medium px-3">Dài · sai · gap</th><th className="text-right font-medium px-3">E-value</th><th className="text-right font-medium px-3">Bit</th></tr></thead>
      <tbody className="divide-y">
        {hits.map((h, i) => (
          <tr key={`${h.accession}-${i}`}>
            <td className="px-3 py-1.5"><span className="font-mono">{h.accession}</span>{labelOf[h.accession] && <div className="text-muted-foreground">{labelOf[h.accession]}</div>}</td>
            <td className={`px-3 text-right tabular-nums font-medium ${h.identity >= 99 ? "text-emerald-700" : h.identity < 95 ? "text-amber-700" : ""}`}>{h.identity.toLocaleString("vi-VN")}%</td>
            <td className="px-3 text-right tabular-nums">{h.queryCoverage}%</td>
            <td className="px-3 text-right tabular-nums">{h.length} · {h.mismatches} · {h.gaps}</td>
            <td className="px-3 text-right tabular-nums">{h.evalue.toExponential(1)}</td>
            <td className="px-3 text-right tabular-nums">{h.bitscore}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
