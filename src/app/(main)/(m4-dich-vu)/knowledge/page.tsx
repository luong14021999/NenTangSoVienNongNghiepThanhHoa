import Link from "next/link";
import { Search, Globe, FileText, LayoutList, Table2, FlaskRound } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog } from "@/components/crud/entity-form-dialog";
import { clip } from "@/components/common/stat-grid";
import { knowledgeStore, searchKnowledge } from "@/lib/modules/m4/data/knowledge";
import { fieldTrialStore, researchTaskStore } from "@/lib/modules/m4/data/research";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { KNOWLEDGE_KINDS } from "@/lib/modules/m4/knowledge";
import { knowledgeFields } from "@/lib/modules/m4/knowledge-fields";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kho tri thức số" };

/** M4.5 – kho tri thức số dạng thư viện: tìm toàn văn là màn hình chính, kết quả dạng tài liệu; bảng là chế độ xem phụ. */
export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; view?: string }> }) {
  const { q = "", kind = "", view = "" } = await searchParams;
  const table = view === "table";
  const [all, hits, tasks, trials] = await Promise.all([
    knowledgeStore.list(),
    searchKnowledge(q, { kind, limit: 100 }),
    researchTaskStore.list(),
    fieldTrialStore.list(),
  ]);
  const itemById = byId(all);
  const taskById = byId(tasks);
  const fields = knowledgeFields(tasks, trials);
  const count = (k: string) => all.filter((x) => x.kind === k).length;
  const link = (o: { kind?: string; view?: string }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const k = o.kind ?? kind;
    if (k) p.set("kind", k);
    const v = o.view ?? view;
    if (v) p.set("view", v);
    return `/knowledge${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <Header title="Kho tri thức số" description="Kết quả đề tài, số liệu thí nghiệm, quy trình kỹ thuật, báo cáo, tiêu chuẩn, phương pháp – tìm kiếm toàn văn không phân biệt dấu" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="rounded-2xl border bg-card p-4 sm:p-6">
          <form method="get" className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row">
            {kind && <input type="hidden" name="kind" value={kind} />}
            {view && <input type="hidden" name="view" value={view} />}
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input name="q" defaultValue={q} maxLength={200} autoFocus placeholder='Tìm toàn văn – VD: lua chiu man, "phân hữu cơ" -ngô, tôm OR cá' className="w-full h-12 rounded-xl border border-input bg-background pl-10 pr-3 text-base" />
            </div>
            <button className="h-12 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Tìm</button>
          </form>
          <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-1.5">
            {["", ...KNOWLEDGE_KINDS].map((k) => (
              <Link key={k || "all"} href={link({ kind: k })} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                {k || "Tất cả"} <span className="ml-1.5 opacity-70">{k ? count(k) : all.length}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">{all.length} tài liệu · {all.filter((x) => x.isPublic).length} công bố trên cổng · tìm không phân biệt dấu, xếp theo mức liên quan</p>
        </section>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{q ? `Kết quả cho “${q}” (${hits.length})` : `Tài liệu mới nhất (${hits.length})`}</h2>
          <div className="ml-auto flex items-center gap-2">
            {!table && <EntityFormDialog mode="add" endpoint="/api/knowledge-items" title="Thêm tài liệu" fields={fields} addLabel="Thêm tài liệu" />}
            <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Kiểu hiển thị">
              <Link href={link({ view: "" })} aria-label="Dạng thư viện" className={`inline-flex h-8 w-8 items-center justify-center rounded ${!table ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}><LayoutList className="h-4 w-4" /></Link>
              <Link href={link({ view: "table" })} aria-label="Dạng bảng" className={`inline-flex h-8 w-8 items-center justify-center rounded ${table ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}><Table2 className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
        {!table && (
          hits.length === 0 ? (
            <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">{q ? "Không tìm thấy tài liệu phù hợp – thử bỏ bớt từ hoặc dùng OR" : "Chưa có tài liệu nào"}</p>
          ) : (
            <ul className="space-y-2">
              {hits.map((h) => {
                const full = itemById.get(h.id);
                const task = full ? taskById.get(full.taskId) : undefined;
                const url = safeUrl(h.url);
                const keywords = (h.keywords || "").split(/[,;]/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
                return (
                  <li key={h.id} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{h.kind}</Badge>
                      <span className="font-mono">{h.code}</span>
                      {h.publishedAt && <span>{fmtDateVN(h.publishedAt)}</span>}
                      {h.source && <span>· {h.source}</span>}
                      <Badge variant={h.isPublic ? "success" : "secondary"} className="ml-auto text-[10px]">{h.isPublic ? <><Globe className="mr-1 h-3 w-3" />Công bố</> : "Nội bộ"}</Badge>
                    </div>
                    <Link href={`/knowledge/${h.id}`} className="mt-1 block text-base font-semibold text-primary hover:underline">{h.title}</Link>
                    {h.abstract && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{h.abstract}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {keywords.map((k) => <Link key={k} href={`/knowledge?q=${encodeURIComponent(k)}`} className="rounded-full bg-muted px-2 py-0.5 text-[11px] hover:bg-accent">{k}</Link>)}
                      {task && <Link href={`/research-tasks/${task.id}`} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] hover:bg-accent"><FlaskRound className="h-3 w-3" />{task.code}</Link>}
                      {url && <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"><FileText className="h-3 w-3" />Tệp gốc</a>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        )}
        {table && <CrudTableCard
          title={q ? `Kết quả cho “${q}” (${hits.length})` : "Tài liệu mới nhất"}
          description={q ? "Sắp xếp theo mức liên quan: tiêu đề > từ khóa, tác giả > tóm tắt, toàn văn" : "Bấm mã để xem liên kết nhiệm vụ – thí nghiệm – tác giả"}
          endpoint="/api/knowledge-items"
          entity="knowledge-items"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/knowledge-items" title="Thêm tài liệu" fields={fields} addLabel="Thêm tài liệu" />}
          headers={["Mã / loại", "Tài liệu", "Nhiệm vụ", "Nguồn · ngày", "Công bố"]}
          emptyText={q ? "Không tìm thấy tài liệu phù hợp" : "Chưa có tài liệu nào"}
          rows={hits.map((h) => {
            const full = itemById.get(h.id);
            const task = full ? taskById.get(full.taskId) : undefined;
            const url = safeUrl(h.url);
            return {
              id: h.id,
              label: h.code,
              initial: full ?? h,
              cells: [
                <div key="c"><Link href={`/knowledge/${h.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{h.code}</Link><div className="text-[11px] text-muted-foreground">{h.kind}</div></div>,
                <div key="t" className="max-w-[380px]">
                  <div className="text-sm font-medium">{h.title}</div>
                  <div className="text-[11px] text-muted-foreground">{clip(h.abstract || h.keywords || "", 140)}</div>
                </div>,
                task ? <Link key="n" href={`/research-tasks/${task.id}`} className="text-xs font-mono hover:underline">{task.code}</Link> : <span key="n" className="text-xs text-muted-foreground">—</span>,
                <div key="s" className="text-xs">
                  {h.source || "—"}
                  <div className="text-muted-foreground">{fmtDateVN(h.publishedAt)}</div>
                  {url && <a href={url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Tệp gốc</a>}
                </div>,
                <Badge key="p" variant={h.isPublic ? "success" : "secondary"}>{h.isPublic ? "Công bố" : "Nội bộ"}</Badge>,
              ],
            };
          })}
        />}
      </main>
    </>
  );
}
