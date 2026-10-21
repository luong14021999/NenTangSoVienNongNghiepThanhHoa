import { GraduationCap, Award, Users, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { researcherStore, researchTaskStore, taskMemberStore } from "@/lib/modules/m4/data/research";
import { ACADEMIC_TITLES, ACTIVE_TASK, DEGREES, RESEARCHER_STATUSES } from "@/lib/modules/m4/research";
import { matches } from "@/lib/platform/ref-options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lý lịch khoa học" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: NCV-001" },
  { name: "fullName", label: "Họ và tên", required: true },
  { name: "degree", label: "Học vị", type: "select", options: [...DEGREES] },
  { name: "academicTitle", label: "Học hàm", type: "select", options: ACADEMIC_TITLES.map((x) => ({ value: x, label: x || "—" })) },
  { name: "specialty", label: "Chuyên ngành" },
  { name: "unit", label: "Phòng / bộ môn" },
  { name: "birthYear", label: "Năm sinh", type: "number" },
  { name: "gender", label: "Giới tính", type: "select", options: ["", "Nam", "Nữ"] },
  { name: "email", label: "Email" },
  { name: "phone", label: "Điện thoại" },
  { name: "staffCode", label: "Mã nhân sự (M2, nếu có)", mono: true },
  { name: "orcid", label: "ORCID", mono: true },
  { name: "status", label: "Tình trạng", type: "select", options: [...RESEARCHER_STATUSES] },
  { name: "publications", label: "Công trình công bố tiêu biểu", type: "textarea" },
  { name: "awards", label: "Giải thưởng, văn bằng", type: "textarea" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function ResearchersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, members, tasks] = await Promise.all([researcherStore.list(), taskMemberStore.list(), researchTaskStore.list()]);
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const tasksOf = (id: string) => {
    const ids = new Set([...members.filter((m) => m.researcherId === id).map((m) => m.taskId), ...tasks.filter((t) => t.leaderId === id).map((t) => t.id)]);
    return [...ids].map((x) => taskById.get(x)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  };
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => a.fullName.localeCompare(b.fullName, "vi")).filter((r) => matches(query, r.code, r.fullName, r.specialty, r.unit));
  const working = all.filter((r) => r.status !== "Nghỉ hưu / chuyển công tác");

  return (
    <>
      <Header title="Lý lịch khoa học" description="Nhân lực nghiên cứu: học vị, học hàm, chuyên ngành, công trình và nhiệm vụ tham gia" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Nhân lực nghiên cứu", value: working.length, icon: Users, accent: "bg-blue-50 text-blue-600", hint: "đang công tác / cộng tác" },
            { label: "Tiến sĩ", value: working.filter((r) => r.degree === "Tiến sĩ").length, icon: GraduationCap, accent: "bg-violet-50 text-violet-600" },
            { label: "Thạc sĩ", value: working.filter((r) => r.degree === "Thạc sĩ").length, icon: BookOpen, accent: "bg-emerald-50 text-emerald-700" },
            { label: "GS / PGS", value: working.filter((r) => r.academicTitle).length, icon: Award, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/researchers" placeholder="Tìm mã, họ tên, chuyên ngành, đơn vị…" />
        </div>
        <CrudTableCard
          title="Danh sách nhà khoa học"
          description="Gắn mã nhân sự M2 để dùng chung hồ sơ năng lực phòng thử nghiệm"
          endpoint="/api/researchers"
          entity="researchers"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/researchers" title="Thêm lý lịch khoa học" fields={FIELDS} addLabel="Thêm" />}
          headers={["Mã", "Họ tên", "Chuyên ngành · đơn vị", "Nhiệm vụ", "Công trình", "Tình trạng"]}
          emptyText={query ? "Không có người phù hợp" : "Chưa có lý lịch khoa học"}
          rows={rows.map((r) => {
            const ts = tasksOf(r.id);
            return {
              id: r.id,
              label: r.fullName,
              initial: r,
              cells: [
                <span key="c" className="font-mono text-xs font-semibold">{r.code}</span>,
                <div key="n">
                  <div className="text-sm font-medium">{[r.academicTitle, r.degree].filter(Boolean).join(" ")} {r.fullName}</div>
                  <div className="text-[11px] text-muted-foreground">{[r.email, r.phone].filter(Boolean).join(" · ")}</div>
                </div>,
                <div key="s" className="text-xs">{r.specialty || "—"}<div className="text-muted-foreground">{r.unit}</div></div>,
                <div key="t" className="text-xs">
                  {ts.length} nhiệm vụ
                  {ts.filter((t) => ACTIVE_TASK.includes(t.status)).length > 0 && <div className="text-muted-foreground">{ts.filter((t) => ACTIVE_TASK.includes(t.status)).length} đang thực hiện</div>}
                </div>,
                <span key="p" className="text-xs text-muted-foreground">{clip(r.publications || "—", 70)}</span>,
                <Badge key="st" variant={r.status === "Đang công tác" ? "success" : "secondary"}>{r.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
