import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FlaskConical, Sprout, Users, Link2, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { knowledgeAuthorStore, knowledgeStore } from "@/lib/modules/m4/data/knowledge";
import { fieldTrialStore, researchTaskStore, researcherStore } from "@/lib/modules/m4/data/research";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { AUTHOR_ROLES } from "@/lib/modules/m4/knowledge";
import { knowledgeFields } from "@/lib/modules/m4/knowledge-fields";
import { findDuplicates } from "@/lib/modules/m4/research";
import { currentAccess } from "@/lib/platform/data/access";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tài liệu kho tri thức" };

/** Liên kết đề tài – thí nghiệm – kết quả – tác giả của 1 tài liệu (M4.5). */
export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [items, authors, researchers, tasks, trials, access] = await Promise.all([
    knowledgeStore.list(),
    knowledgeAuthorStore.list(),
    researcherStore.list(),
    researchTaskStore.list(),
    fieldTrialStore.list(),
    currentAccess(),
  ]);
  const k = items.find((x) => x.id === id);
  if (!k) notFound();
  const researcherById = byId(researchers);
  const task = tasks.find((t) => t.id === k.taskId);
  const trial = trials.find((t) => t.id === k.fieldTrialId);
  const myAuthors = authors.filter((a) => a.itemId === id);
  const sameTask = task ? items.filter((x) => x.taskId === task.id && x.id !== id) : [];
  const similar = findDuplicates(k, items, { excludeId: id, limit: 6 }).filter((s) => !sameTask.some((x) => x.id === s.item.id));
  const url = safeUrl(k.url);
  const authorFields: CrudField[] = [
    { name: "itemId", label: "Tài liệu", type: "select", options: [{ value: k.id, label: k.code }], defaultValue: k.id },
    { name: "researcherId", label: "Tác giả (lý lịch khoa học)", type: "select", required: true, options: refOptions(researchers, (r) => `${r.code} · ${r.fullName}`) },
    { name: "role", label: "Vai trò", type: "select", options: [...AUTHOR_ROLES] },
  ];

  return (
    <>
      <Header title={k.code} description={k.title} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-auto">
            <ArrowLeft className="w-4 h-4" /> Kho tri thức
          </Link>
          {k.isPublic && (
            <Link href={`/portal/knowledge/${encodeURIComponent(k.code)}`} target="_blank" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent">
              <ExternalLink className="w-4 h-4" /> Xem trên cổng
            </Link>
          )}
          {access.can("write.research") && <EntityFormDialog mode="edit" endpoint="/api/knowledge-items" id={k.id} title={`Sửa ${k.code}`} fields={knowledgeFields(tasks, trials)} initial={k} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">{k.title} <Badge variant="outline">{k.kind}</Badge> <Badge variant={k.isPublic ? "success" : "secondary"}>{k.isPublic ? "Công bố" : "Nội bộ"}</Badge></CardTitle>
            <CardDescription>{[k.source, fmtDateVN(k.publishedAt), k.keywords].filter(Boolean).join(" · ")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {k.abstract && <p className="whitespace-pre-line">{k.abstract}</p>}
            {k.externalAuthors && <p><span className="text-muted-foreground">Tác giả ngoài Viện: </span>{k.externalAuthors}</p>}
            {url && <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="w-3.5 h-3.5" />Mở tệp gốc</a>}
            {k.content && (
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">Nội dung toàn văn ({k.content.length.toLocaleString("vi-VN")} ký tự)</summary>
                <div className="mt-2 whitespace-pre-line text-xs max-h-96 overflow-y-auto">{k.content}</div>
              </details>
            )}
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" />Nhiệm vụ</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {task ? (
                <Link href={`/research-tasks/${task.id}`} className="hover:underline"><span className="font-mono text-xs">{task.code}</span> {task.title}<div className="text-xs text-muted-foreground">{task.level} · {task.status}</div></Link>
              ) : <span className="text-muted-foreground">Chưa gắn nhiệm vụ</span>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sprout className="w-4 h-4" />Thí nghiệm</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {trial ? (
                <Link href={`/field-trials?q=${encodeURIComponent(trial.code)}`} className="hover:underline"><span className="font-mono text-xs">{trial.code}</span> {trial.title}<div className="text-xs text-muted-foreground">{trial.crop} · {trial.season} · {trial.location}</div></Link>
              ) : <span className="text-muted-foreground">Chưa gắn thí nghiệm</span>}
            </CardContent>
          </Card>
        </section>

        <CrudTableCard
          title="Tác giả trong Viện"
          description="Liên kết với lý lịch khoa học – tài liệu hiện trong hồ sơ công trình của tác giả"
          endpoint="/api/knowledge-authors"
          entity="knowledge-authors"
          editFields={authorFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/knowledge-authors" title="Thêm tác giả" fields={authorFields} addLabel="Thêm tác giả" />}
          headers={["Tác giả", "Vai trò", "Chuyên ngành"]}
          emptyText="Chưa gắn tác giả"
          rows={myAuthors.map((a) => {
            const r = researcherById.get(a.researcherId);
            return {
              id: a.id,
              label: r?.fullName ?? a.researcherId,
              initial: a,
              cells: [
                <span key="n" className="text-sm inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-muted-foreground" />{r ? `${[r.academicTitle, r.degree].filter(Boolean).join(" ")} ${r.fullName}` : "—"}</span>,
                <span key="r" className="text-xs">{a.role}</span>,
                <span key="s" className="text-xs text-muted-foreground">{r?.specialty ?? ""}</span>,
              ],
            };
          })}
        />

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="w-4 h-4" />Tài liệu liên quan</CardTitle><CardDescription>Cùng nhiệm vụ, hoặc giống tiêu đề / từ khóa</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {[...sameTask.map((x) => ({ item: x, why: "cùng nhiệm vụ" })), ...similar.map((s) => ({ item: s.item, why: `giống ${Math.round(s.score * 100)}%` }))].map(({ item, why }) => (
                <li key={item.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <Link href={`/knowledge/${item.id}`} className="hover:underline"><span className="font-mono text-xs">{item.code}</span> {item.title}</Link>
                  <span className="text-xs text-muted-foreground">{item.kind} · {why}</span>
                </li>
              ))}
              {sameTask.length + similar.length === 0 && <li className="py-2 text-muted-foreground">Chưa có tài liệu liên quan</li>}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
