import { CheckCircle2, ShieldCheck, Sprout, GitMerge, TreePine } from "lucide-react";
import type { PublicSeedTrace } from "@/lib/modules/m3/data/breeding";
import { fmtDateVN } from "@/lib/platform/dates";

/** Trang truy xuất công khai của lô giống M3.2 (chỉ dữ liệu được phép công bố). */
export function SeedTraceView({ t }: { t: PublicSeedTrace }) {
  const certified = t.status === "Đã chứng nhận" || t.status === "Đạt";
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className={`rounded-xl border-2 bg-card p-5 ${certified ? "border-emerald-500" : "border-amber-500"}`}>
        <div className="flex items-center gap-2 text-lg font-bold">
          <CheckCircle2 className={`w-6 h-6 ${certified ? "text-emerald-600" : "text-amber-600"}`} />Giống do Viện Nông nghiệp tỉnh Thanh Hóa sản xuất
        </div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Mã lô</dt><dd className="font-mono font-semibold">{t.code}</dd>
          <dt className="text-muted-foreground">Giống</dt><dd className="font-medium">{[t.variety, t.species].filter(Boolean).join(" – ") || "—"}</dd>
          <dt className="text-muted-foreground">Cấp giống</dt><dd>{t.level}</dd>
          <dt className="text-muted-foreground">Ngày sản xuất</dt><dd>{fmtDateVN(t.producedAt) || "—"}</dd>
          <dt className="text-muted-foreground">Tình trạng</dt><dd>{t.status}</dd>
        </dl>
      </div>
      <div className="rounded-lg border bg-card p-4 space-y-1.5 text-sm">
        <div className="font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />Pháp lý & chất lượng</div>
        <div className="grid grid-cols-[10rem_1fr] gap-x-2 gap-y-1 text-xs">
          <span className="text-muted-foreground">Công nhận giống</span><span>{t.recognitionNo || "—"}</span>
          <span className="text-muted-foreground">Lưu hành</span><span>{t.circulation || "—"}</span>
          <span className="text-muted-foreground">Chứng nhận chất lượng</span><span>{t.certificateNo ? `${t.certificateNo} · ${fmtDateVN(t.certifiedAt)}` : "—"}</span>
          <span className="text-muted-foreground">Hợp quy</span><span>{t.conformityNo ? `${t.conformityNo}${t.conformityUntil ? ` · hiệu lực đến ${fmtDateVN(t.conformityUntil)}` : ""}` : "—"}</span>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
        <div className="font-medium flex items-center gap-2"><GitMerge className="w-4 h-4 text-primary" />Chuỗi sản xuất theo cấp</div>
        <ol className="space-y-1 text-xs">
          {t.chain.map((c) => (
            <li key={c.code} className="flex flex-wrap gap-x-2"><Sprout className="w-3.5 h-3.5 text-primary" /><span className="font-medium">{c.level}</span><span className="text-muted-foreground">{[c.season, c.facility, c.harvestedAt && `thu hoạch ${fmtDateVN(c.harvestedAt)}`].filter(Boolean).join(" · ")}</span></li>
          ))}
          {t.source && <li className="flex flex-wrap gap-x-2"><TreePine className="w-3.5 h-3.5 text-primary" /><span className="font-medium">Nguồn giống gốc: {t.source.kind} {t.source.name}</span>{t.source.recognitionNo && <span className="text-muted-foreground">QĐ {t.source.recognitionNo}</span>}</li>}
          {t.chain.length === 0 && !t.source && <li className="text-muted-foreground">Chưa công bố</li>}
        </ol>
      </div>
    </div>
  );
}
