import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { searchKnowledge } from "@/lib/modules/m4/data/knowledge";
import { KNOWLEDGE_KINDS } from "@/lib/modules/m4/knowledge";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tra cứu tri thức KH&CN – Viện Nông nghiệp tỉnh Thanh Hóa" };

/** Tra cứu công khai kho tri thức (M4.5): chỉ tài liệu đã đánh dấu Công bố, không có toàn văn / ghi chú nội bộ. */
export default async function PublicKnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 200);
  const kind = (KNOWLEDGE_KINDS as readonly string[]).includes(sp.kind ?? "") ? sp.kind! : "";
  const hits = await searchKnowledge(q, { publicOnly: true, kind, limit: 50 });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" />Tra cứu tri thức khoa học và công nghệ</h1>
        <p className="text-sm text-muted-foreground mt-1">Quy trình kỹ thuật, kết quả nghiên cứu, tài liệu hướng dẫn do Viện công bố. Gõ có dấu hay không dấu đều được.</p>
      </div>
      <form method="get" className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} maxLength={200} placeholder="VD: quy trình trồng lúa chịu mặn" className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
        </div>
        <select name="kind" defaultValue={kind} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Tất cả loại</option>
          {KNOWLEDGE_KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
        <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Tìm</button>
      </form>
      <ul className="space-y-3">
        {hits.map((h) => (
          <li key={h.code} className="rounded-xl border bg-card p-4">
            <div className="text-[11px] text-muted-foreground">{h.kind}{h.publishedAt && ` · ${fmtDateVN(h.publishedAt)}`}{h.source && ` · ${h.source}`}</div>
            <Link href={`/portal/knowledge/${encodeURIComponent(h.code)}`} className="font-medium text-primary hover:underline">{h.title}</Link>
            {h.abstract && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{h.abstract}</p>}
          </li>
        ))}
        {hits.length === 0 && <li className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{q ? "Không tìm thấy tài liệu phù hợp." : "Chưa có tài liệu công bố."}</li>}
      </ul>
    </div>
  );
}
