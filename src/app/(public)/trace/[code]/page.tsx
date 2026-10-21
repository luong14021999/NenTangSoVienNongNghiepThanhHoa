import Link from "next/link";
import { CheckCircle2, XCircle, Leaf, FlaskConicalOff, Boxes, Sprout } from "lucide-react";
import { publicLotTrace } from "@/lib/modules/m3/data/trace";
import { fmtPct, survivalRate } from "@/lib/modules/m3/rates";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Truy xuất nguồn gốc lô giống – Viện Nông nghiệp tỉnh Thanh Hóa", robots: { index: false } };

export default async function TracePage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const t = await publicLotTrace(code);

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

  const steps = [
    {
      icon: Leaf,
      title: "Vật liệu khởi đầu",
      rows: [["Mã", t.materialCode], ["Loại mẫu cấy", t.explantType], ["Ngày lấy mẫu", fmtDateVN(t.collectedAt)]],
    },
    {
      icon: FlaskConicalOff,
      title: "Môi trường nuôi cấy",
      rows: [["Công thức", [t.recipeCode, t.recipeName].filter(Boolean).join(" · ")], ["Môi trường nền", t.baseMedium]],
    },
    {
      icon: Boxes,
      title: "Mẻ cấy",
      rows: [["Mã mẻ", t.batchCode], ["Giai đoạn", t.stage && `${t.stage} · cấy chuyển lần ${t.subcultureNo}`], ["Ngày cấy", fmtDateVN(t.batchStartedAt)]],
    },
    {
      icon: Sprout,
      title: "Ra ngôi & xuất vườn",
      rows: [
        ["Ngày ra ngôi", fmtDateVN(t.acclimatizedAt)],
        ["Tỷ lệ sống", t.quantity ? `${fmtPct(survivalRate(t))}` : ""],
        ["Phân loại", t.grade],
        ["Ngày xuất", fmtDateVN(t.releasedAt)],
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-xl border-2 border-emerald-500 bg-card p-5">
        <div className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 className="w-6 h-6 text-emerald-600" />Cây giống do Viện Nông nghiệp tỉnh Thanh Hóa sản xuất</div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Mã lô</dt><dd className="font-mono font-semibold">{t.lotCode}</dd>
          <dt className="text-muted-foreground">Loài – giống</dt><dd className="font-medium">{[t.species, t.variety].filter(Boolean).join(" – ") || "—"}</dd>
          <dt className="text-muted-foreground">Phương pháp</dt><dd>Nhân giống in vitro (nuôi cấy mô)</dd>
          <dt className="text-muted-foreground">Trạng thái</dt><dd>{t.status}</dd>
        </dl>
      </div>

      <ol className="relative border-l-2 border-primary/30 ml-3 space-y-4">
        {steps.map((s) => (
          <li key={s.title} className="ml-6">
            <span className="absolute -left-[13px] w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <s.icon className="w-3.5 h-3.5" />
            </span>
            <div className="rounded-lg border bg-card p-4">
              <div className="font-medium text-sm">{s.title}</div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-mono">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/trace" className="inline-block text-sm text-primary hover:underline">← Tra cứu mã khác</Link>
    </div>
  );
}
