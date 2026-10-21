import Link from "next/link";
import { XCircle, Send } from "lucide-react";
import { publicMarketPost } from "@/lib/modules/m3/data/genomics";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thông tin giống – Viện Nông nghiệp tỉnh Thanh Hóa" };

export default async function PublicMarketPostPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).slice(0, 64);
  const p = await publicMarketPost(code);
  if (!p) {
    return (
      <div className="max-w-2xl mx-auto rounded-xl border-2 border-rose-500 bg-card p-5">
        <div className="flex items-center gap-2 font-bold"><XCircle className="w-5 h-5 text-rose-600" />Không tìm thấy tin</div>
        <Link href="/portal/giong" className="inline-block mt-3 text-sm text-primary hover:underline">← Giống của Viện</Link>
      </div>
    );
  }
  return (
    <article className="max-w-3xl mx-auto space-y-4">
      <Link href="/portal/giong" className="text-sm text-primary hover:underline">← Giống của Viện</Link>
      <div className="rounded-xl border bg-card p-5 sm:p-6 space-y-3">
        <div className="text-xs text-muted-foreground">{[p.kind, fmtDateVN(p.published_at), p.variety, p.area].filter(Boolean).join(" · ")}</div>
        <h1 className="text-xl sm:text-2xl font-bold">{p.title}</h1>
        {p.summary && <p className="text-sm font-medium">{p.summary}</p>}
        {p.price_note && <p className="text-sm">💲 {p.price_note}</p>}
        {p.content && <div className="text-sm leading-relaxed whitespace-pre-line">{p.content}</div>}
        <Link
          href={`/portal/request?${new URLSearchParams({ kind: "Giống cây trồng, vật nuôi, thủy sản", desc: `Liên quan tin ${p.code} – ${p.title}: ` })}`}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm"
        >
          <Send className="w-4 h-4" /> Liên hệ / đăng ký
        </Link>
      </div>
    </article>
  );
}
