import Link from "next/link";
import { CheckCircle2, XCircle, TreeDeciduous, Leaf, Boxes, Sprout, ShieldCheck } from "lucide-react";
import { publicLotTrace } from "@/lib/modules/m3/data/trace";
import { fmtPct, survivalRate } from "@/lib/modules/m3/rates";
import { LotFeedbackForm } from "@/components/m3/lot-feedback-form";
import { SeedTraceView } from "@/components/m3/seed-trace-view";
import { publicSeedTrace } from "@/lib/modules/m3/data/breeding";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Truy xuất nguồn gốc lô giống – Viện Nông nghiệp tỉnh Thanh Hóa", robots: { index: false } };

function Step({ icon: Icon, title, children }: { icon: typeof Leaf; title: string; children: React.ReactNode }) {
  return (
    <li className="ml-6">
      <span className="absolute -left-[13px] w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Icon className="w-3.5 h-3.5" /></span>
      <div className="rounded-lg border bg-card p-4">
        <div className="font-medium text-sm">{title}</div>
        <div className="mt-2 text-xs space-y-1">{children}</div>
      </div>
    </li>
  );
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="grid grid-cols-[8rem_1fr] gap-2"><span className="text-muted-foreground">{k}</span><span>{v || "—"}</span></div>
);

export default async function TracePage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const t = await publicLotTrace(code);
  // Không phải lô cây giống nuôi cấy mô → tra lô giống M3.2 (cùng hệ thống mã QR).
  const seed = t ? null : await publicSeedTrace(code);
  if (seed) {
    return (
      <div className="space-y-4">
        <SeedTraceView t={seed} />
        <div className="max-w-2xl mx-auto"><Link href="/trace" className="text-sm text-primary hover:underline">← Tra cứu mã khác</Link></div>
      </div>
    );
  }

  if (!t) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-xl border-2 border-rose-500 bg-card p-5">
          <div className="flex items-center gap-2 text-lg font-bold"><XCircle className="w-6 h-6 text-rose-600" />Không tìm thấy lô giống</div>
          <p className="text-sm text-muted-foreground mt-2">
            Mã <span className="font-mono">{code.slice(0, 64)}</span> không có trong hệ thống của Viện. Hãy kiểm tra lại mã trên tem, hoặc liên hệ Viện để được hỗ trợ.
          </p>
        </div>
        <Link href="/trace" className="inline-block mt-4 text-sm text-primary hover:underline">← Tra cứu mã khác</Link>
      </div>
    );
  }

  const firstBatch = t.batches[0];
  const lastBatch = t.batches[t.batches.length - 1];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-xl border-2 border-emerald-500 bg-card p-5">
        <div className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 className="w-6 h-6 text-emerald-600" />Cây giống do Viện Nông nghiệp tỉnh Thanh Hóa sản xuất</div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Mã lô</dt><dd className="font-mono font-semibold">{t.lotCode}</dd>
          <dt className="text-muted-foreground">Loài – giống</dt><dd className="font-medium">{[t.species, t.variety].filter(Boolean).join(" – ") || "—"}</dd>
          <dt className="text-muted-foreground">Phương pháp</dt><dd>Nhân giống in vitro (nuôi cấy mô){t.batches.length > 0 && ` · ${t.batches.length} lần cấy`}</dd>
          {t.mother && (
            <>
              <dt className="text-muted-foreground">Cây mẹ</dt>
              <dd className="flex items-center gap-1.5">
                {t.mother.diseaseStatus === "Sạch bệnh" && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                {t.mother.diseaseStatus}{t.mother.pathogens && ` (${t.mother.pathogens})`}
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">Trạng thái</dt><dd>{t.status}</dd>
        </dl>
      </div>

      <ol className="relative border-l-2 border-primary/30 ml-3 space-y-4">
        <Step icon={TreeDeciduous} title="Cây mẹ">
          {t.mother ? (
            <>
              <Row k="Mã cây mẹ" v={<span className="font-mono">{t.mother.code}</span>} />
              <Row k="Nguồn gốc" v={t.mother.origin} />
              <Row k="Kiểm tra sạch bệnh" v={[t.mother.diseaseStatus, t.mother.diseaseMethod, fmtDateVN(t.mother.diseaseTestedAt)].filter(Boolean).join(" · ")} />
              {t.mother.pathogens && <Row k="Tác nhân kiểm tra" v={t.mother.pathogens} />}
            </>
          ) : <Row k="Cây mẹ" v="Chưa công bố" />}
        </Step>
        <Step icon={Leaf} title="Vật liệu khởi đầu">
          <Row k="Mã" v={<span className="font-mono">{t.materialCode}</span>} />
          <Row k="Loại mẫu cấy" v={t.explantType} />
          <Row k="Ngày lấy mẫu" v={fmtDateVN(t.collectedAt)} />
        </Step>
        <Step icon={Boxes} title={`Nuôi cấy in vitro (${t.batches.length} mẻ)`}>
          {t.batches.length ? (
            <>
              <Row k="Bắt đầu" v={fmtDateVN(firstBatch.startedAt)} />
              <Row k="Mẻ cuối" v={`${lastBatch.stage} · cấy chuyển lần ${lastBatch.subcultureNo} · ${fmtDateVN(lastBatch.startedAt)}`} />
              <Row k="Môi trường" v={[...new Set(t.batches.map((b) => [b.recipeCode, b.baseMedium].filter(Boolean).join(" ")).filter(Boolean))].join(", ")} />
              <details className="pt-1">
                <summary className="cursor-pointer text-muted-foreground">Chi tiết các mẻ</summary>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {t.batches.map((b) => <li key={b.code}>{b.code} · {b.stage} · lần {b.subcultureNo} · {fmtDateVN(b.startedAt)}</li>)}
                </ul>
              </details>
            </>
          ) : <Row k="Mẻ cấy" v="Chưa công bố" />}
        </Step>
        <Step icon={Sprout} title="Ra ngôi & vườn ươm">
          <Row k="Ngày ra ngôi" v={fmtDateVN(t.acclimatizedAt)} />
          <Row k="Đủ tiêu chuẩn xuất" v={fmtDateVN(t.readyAt)} />
          <Row k="Tỷ lệ sống vườn ươm" v={t.quantity ? fmtPct(survivalRate(t)) : ""} />
          <Row k="Phân loại" v={t.grade} />
        </Step>
      </ol>

      <LotFeedbackForm lotCode={t.lotCode} />
      <Link href="/trace" className="inline-block text-sm text-primary hover:underline">← Tra cứu mã khác</Link>
    </div>
  );
}
