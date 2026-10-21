import Link from "next/link";
import { BookOpen, Search, Globe, FileText } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog } from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { knowledgeStore, searchKnowledge } from "@/lib/modules/m4/data/knowledge";
import { fieldTrialStore, researchTaskStore } from "@/lib/modules/m4/data/research";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { KNOWLEDGE_KINDS } from "@/lib/modules/m4/knowledge";
import { knowledgeFields } from "@/lib/modules/m4/knowledge-fields";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kho tri thức số" };

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string }> }) {
  const { q = "", kind = "" } = await searchParams;
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

  return (
    <>
      <Header title="Kho tri thức số" description="Kết quả đề tài, số liệu thí nghiệm, quy trình kỹ thuật, báo cáo, tiêu chuẩn, phương pháp – tìm kiếm toàn văn không phân biệt dấu" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tài liệu", value: all.length, icon: BookOpen, accent: "bg-blue-50 text-blue-600" },
            { label: "Quy trình kỹ thuật", value: count("Quy trình kỹ thuật"), icon: FileText, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Kết quả đề tài", value: count("Kết quả đề tài"), icon: FileText, accent: "bg-violet-50 text-violet-600" },
            { label: "Công bố trên cổng", value: all.filter((x) => x.isPublic).length, icon: Globe, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <form method="get" className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input name="q" defaultValue={q} maxLength={200} placeholder='Tìm toàn văn – VD: lua chiu man, "phân hữu cơ" -ngô, tôm OR cá' className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
          </div>
          <select name="kind" defaultValue={kind} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">Tất cả loại</option>
            {KNOWLEDGE_KINDS.map((k) => <option key={k}>{k}</option>)}
          </select>
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Tìm</button>
        </form>
        <CrudTableCard
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
        />
      </main>
    </>
  );
}
