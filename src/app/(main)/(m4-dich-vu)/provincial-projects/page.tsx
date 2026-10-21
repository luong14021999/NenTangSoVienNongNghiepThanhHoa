import Link from "next/link";
import { Library, Search } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { clip } from "@/components/common/stat-grid";
import { provincialProjectStore, researchTaskStore } from "@/lib/modules/m4/data/research";
import { RESEARCH_FIELDS, TASK_LEVELS, duplicateLevel, findDuplicates } from "@/lib/modules/m4/research";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đề tài trên địa bàn tỉnh" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã", required: true, mono: true },
  { name: "level", label: "Cấp", type: "select", options: ["", ...TASK_LEVELS] },
  { name: "title", label: "Tên đề tài / dự án", required: true, full: true },
  { name: "hostOrg", label: "Đơn vị chủ trì" },
  { name: "leader", label: "Chủ nhiệm" },
  { name: "field", label: "Lĩnh vực", type: "select", options: ["", ...RESEARCH_FIELDS] },
  { name: "status", label: "Tình trạng", placeholder: "Đang thực hiện / Đã nghiệm thu…" },
  { name: "startYear", label: "Năm bắt đầu", type: "number" },
  { name: "endYear", label: "Năm kết thúc", type: "number" },
  { name: "keywords", label: "Từ khóa", full: true },
  { name: "source", label: "Nguồn", type: "select", options: ["Nhập tay", "Sở KH&CN", "CSDL quốc gia"] },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function ProvincialProjectsPage({ searchParams }: { searchParams: Promise<{ title?: string; keywords?: string }> }) {
  const { title = "", keywords = "" } = await searchParams;
  const [all, tasks] = await Promise.all([provincialProjectStore.list(), researchTaskStore.list()]);
  const checking = title.trim().length > 0;
  const results = checking
    ? findDuplicates({ title: title.slice(0, 500), keywords: keywords.slice(0, 300) }, [
        ...all.map((p) => ({ id: `p-${p.id}`, title: p.title, keywords: p.keywords, meta: `${p.code} · ${p.hostOrg || "—"} · ${p.startYear || ""}–${p.endYear || ""} · ${p.status || ""}` })),
        ...tasks.map((t) => ({ id: t.id, title: t.title, keywords: t.keywords, meta: `${t.code} · nhiệm vụ của Viện · ${t.status}`, href: `/research-tasks/${t.id}` })),
      ], { limit: 15 })
    : [];
  const rows = [...all].sort((a, b) => (b.startYear || 0) - (a.startYear || 0) || a.code.localeCompare(b.code));

  return (
    <>
      <Header title="Đề tài, dự án trên địa bàn tỉnh" description="Danh mục tra cứu chống trùng lặp trước khi đề xuất nhiệm vụ mới" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="w-4 h-4" />Kiểm tra trùng lặp ý tưởng đề xuất</CardTitle>
            <CardDescription>So với {all.length} đề tài trong danh mục tỉnh và {tasks.length} nhiệm vụ của Viện – bỏ dấu, bỏ các từ chung chung (nghiên cứu, ứng dụng, Thanh Hóa…)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form method="get" className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2">
              <input name="title" defaultValue={title} required maxLength={500} placeholder="Tên nhiệm vụ dự kiến" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              <input name="keywords" defaultValue={keywords} maxLength={300} placeholder="Từ khóa (không bắt buộc)" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Kiểm tra</button>
            </form>
            {checking && (
              <ul className="divide-y text-sm rounded-lg border">
                {results.map(({ item, score }) => (
                  <li key={item.id} className="px-3 py-2 flex flex-wrap items-start gap-x-3 gap-y-1">
                    <Badge variant={score >= 0.5 ? "destructive" : "warning"}>{duplicateLevel(score)} · {Math.round(score * 100)}%</Badge>
                    <span className="min-w-0 flex-1">
                      {"href" in item && item.href ? <Link href={item.href} className="hover:underline">{item.title}</Link> : item.title}
                      <div className="text-[11px] text-muted-foreground">{item.meta}</div>
                    </span>
                  </li>
                ))}
                {results.length === 0 && <li className="px-3 py-3 text-muted-foreground">Không thấy đề tài tương tự (ngưỡng 30%) – vẫn nên tra thêm CSDL quốc gia về KH&CN</li>}
              </ul>
            )}
          </CardContent>
        </Card>

        <CrudTableCard
          title="Danh mục đề tài, dự án"
          description="Nhập từ danh mục Sở KH&CN công bố hằng năm hoặc tra cứu CSDL quốc gia"
          endpoint="/api/provincial-projects"
          entity="provincial-projects"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/provincial-projects" title="Thêm đề tài / dự án" fields={FIELDS} addLabel="Thêm" />}
          headers={["Mã / cấp", "Tên", "Đơn vị · chủ nhiệm", "Thời gian", "Tình trạng"]}
          emptyText="Chưa có đề tài nào trong danh mục"
          rows={rows.map((p) => ({
            id: p.id,
            label: p.code,
            initial: p,
            cells: [
              <div key="c"><div className="font-mono text-xs font-semibold">{p.code}</div><div className="text-[11px] text-muted-foreground">{p.level}</div></div>,
              <div key="t" className="max-w-[360px]"><div className="text-sm">{clip(p.title, 120)}</div>{p.keywords && <div className="text-[11px] text-muted-foreground">{p.keywords}</div>}</div>,
              <div key="o" className="text-xs">{p.hostOrg || "—"}<div className="text-muted-foreground">{p.leader}</div></div>,
              <span key="y" className="text-xs whitespace-nowrap">{p.startYear || "?"}–{p.endYear || "?"}</span>,
              <span key="s" className="text-xs">{p.status || "—"}<div className="text-muted-foreground inline-flex items-center gap-1"><Library className="w-3 h-3" />{p.source}</div></span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
