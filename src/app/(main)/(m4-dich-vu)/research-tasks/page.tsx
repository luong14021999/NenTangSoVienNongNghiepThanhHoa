import Link from "next/link";
import { FlaskConical, PlayCircle, AlertTriangle, Banknote } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { researchTaskStore, researcherStore, taskExpenseStore, taskMilestoneStore } from "@/lib/modules/m4/data/research";
import { ACTIVE_TASK, TASK_STATUSES, budgetSummary, milestoneProgress, taskAlerts } from "@/lib/modules/m4/research";
import { researchTaskFields, taskStatusVariant } from "@/lib/modules/m4/research-fields";
import { fmtVND } from "@/lib/modules/m4/finance";
import { byId, matches } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nhiệm vụ KH&CN" };

export default async function ResearchTasksPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const [all, researchers, milestones, expenses] = await Promise.all([
    researchTaskStore.list(),
    researcherStore.list(),
    taskMilestoneStore.list(),
    taskExpenseStore.list(),
  ]);
  const researcherById = byId(researchers);
  const fields = researchTaskFields(researchers);
  const today = todayISO();
  const msOf = (id: string) => milestones.filter((m) => m.taskId === id);
  const exOf = (id: string) => expenses.filter((e) => e.taskId === id);

  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((t) => (!status || t.status === status) && matches(query, t.code, t.title, t.keywords, t.field, researcherById.get(t.leaderId)?.fullName));
  const active = all.filter((t) => ACTIVE_TASK.includes(t.status));
  const year = today.slice(0, 4);

  return (
    <>
      <Header title="Nhiệm vụ KH&CN" description="Đề tài, dự án theo vòng đời: đề xuất → phê duyệt → thực hiện (tiến độ, kinh phí) → nghiệm thu" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Nhiệm vụ", value: all.length, icon: FlaskConical, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang triển khai", value: active.length, icon: PlayCircle, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Có cảnh báo", value: active.filter((t) => taskAlerts(t, msOf(t.id), exOf(t.id), today).length > 0).length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "trễ mốc / quá hạn / vượt kinh phí" },
            {
              label: `Giải ngân ${year}`,
              value: fmtVND(expenses.filter((e) => (e.spentAt || "").startsWith(year)).reduce((s, e) => s + e.amount, 0)),
              icon: Banknote,
              accent: "bg-violet-50 text-violet-600",
            },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {["", ...TASK_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={`/research-tasks?${new URLSearchParams({ ...(q && { q }), ...(s && { status: s }) })}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${status === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
            >
              {s || "Tất cả"} <span className="ml-1.5 opacity-70">{s ? all.filter((t) => t.status === s).length : all.length}</span>
            </Link>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/research-tasks" placeholder="Tìm mã, tên, từ khóa, chủ nhiệm…" />
          </div>
        </div>
        <CrudTableCard
          title="Danh sách nhiệm vụ"
          description="Bấm mã nhiệm vụ để quản lý tiến độ, kinh phí, thành viên, mẫu phân tích và kiểm tra trùng lặp"
          endpoint="/api/research-tasks"
          entity="research-tasks"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/research-tasks" title="Đề xuất nhiệm vụ" fields={fields} addLabel="Đề xuất nhiệm vụ" />}
          headers={["Mã / cấp", "Nhiệm vụ", "Chủ nhiệm", "Thời gian", "Tiến độ · kinh phí", "Trạng thái"]}
          emptyText={query || status ? "Không có nhiệm vụ phù hợp" : "Chưa có nhiệm vụ nào"}
          rows={rows.map((t) => {
            const p = milestoneProgress(msOf(t.id), today);
            const b = budgetSummary(t, exOf(t.id));
            const alerts = taskAlerts(t, msOf(t.id), exOf(t.id), today);
            const leader = researcherById.get(t.leaderId);
            return {
              id: t.id,
              label: t.code,
              initial: t,
              cells: [
                <div key="c">
                  <Link href={`/research-tasks/${t.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{t.code}</Link>
                  <div className="text-[11px] text-muted-foreground">{t.level} · {t.kind}</div>
                </div>,
                <div key="t" className="max-w-[320px]">
                  <div className="text-sm">{clip(t.title, 110)}</div>
                  {t.field && <div className="text-[11px] text-muted-foreground">{t.field}</div>}
                </div>,
                <span key="l" className="text-xs">{leader ? `${leader.degree ? leader.degree + " " : ""}${leader.fullName}` : "—"}</span>,
                <span key="d" className="text-xs whitespace-nowrap">{fmtDateVN(t.startAt) || "—"} → {fmtDateVN(t.endAt) || "…"}</span>,
                <div key="p" className="text-[11px] whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${p.pct}%` }} /></div>
                    <span>{p.done}/{p.total} mốc</span>
                  </div>
                  <div className="text-muted-foreground mt-0.5">{b.total ? `${fmtVND(b.spent)} / ${fmtVND(b.total)} (${b.pct}%)` : "chưa có kinh phí"}</div>
                  {alerts.map((a) => (
                    <div key={a.kind} className={a.kind === "Sắp kết thúc" ? "text-amber-600" : "text-rose-600 font-medium"}>{a.kind} · {a.detail}</div>
                  ))}
                </div>,
                <Badge key="s" variant={taskStatusVariant[t.status] ?? "secondary"}>{t.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
