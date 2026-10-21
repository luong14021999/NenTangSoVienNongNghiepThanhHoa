import Link from "next/link";
import { ExternalLink, XCircle } from "lucide-react";
import { publicKnowledgeItem } from "@/lib/modules/m4/data/knowledge";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tài liệu KH&CN – Viện Nông nghiệp tỉnh Thanh Hóa" };

export default async function PublicKnowledgeItemPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).slice(0, 64);
  const k = await publicKnowledgeItem(code);
  if (!k) {
    return (
      <div className="max-w-2xl mx-auto rounded-xl border-2 border-rose-500 bg-card p-5">
        <div className="flex items-center gap-2 font-bold"><XCircle className="w-5 h-5 text-rose-600" />Không tìm thấy tài liệu</div>
        <Link href="/portal/knowledge" className="inline-block mt-3 text-sm text-primary hover:underline">← Tra cứu tài liệu khác</Link>
      </div>
    );
  }
  const url = safeUrl(k.url);
  return (
    <article className="max-w-3xl mx-auto space-y-4">
      <Link href="/portal/knowledge" className="text-sm text-primary hover:underline">← Tra cứu tri thức</Link>
      <div className="rounded-xl border bg-card p-5 sm:p-6 space-y-3">
        <div className="text-xs text-muted-foreground">{[k.kind, fmtDateVN(k.published_at), k.source].filter(Boolean).join(" · ")}</div>
        <h1 className="text-xl sm:text-2xl font-bold">{k.title}</h1>
        {k.external_authors && <p className="text-sm"><span className="text-muted-foreground">Tác giả: </span>{k.external_authors}</p>}
        {k.keywords && <p className="text-sm"><span className="text-muted-foreground">Từ khóa: </span>{k.keywords}</p>}
        {k.abstract && <p className="text-sm leading-relaxed whitespace-pre-line">{k.abstract}</p>}
        {url && (
          <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm">
            <ExternalLink className="w-4 h-4" /> Xem toàn văn
          </a>
        )}
        <p className="text-[11px] text-muted-foreground pt-2 border-t">Mã tài liệu {k.code} · Viện Nông nghiệp tỉnh Thanh Hóa. Cần tư vấn áp dụng? <Link href="/portal/request" className="text-primary hover:underline">Gửi yêu cầu</Link>.</p>
      </div>
    </article>
  );
}
