import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/platform/action-button";
import { GanttChart, type GanttRow } from "@/components/m4/gantt/gantt-chart";
import { researchTaskStore, researcherStore, taskExpenseStore, taskMilestoneStore } from "@/lib/modules/m4/data/research";
import { ACTIVE_TASK, TASK_LEVELS, milestoneProgress, taskAlerts } from "@/lib/modules/m4/research";
import { barPosition, ganttWindow } from "@/lib/modules/m4/workspace";
import { currentAccess } from "@/lib/platform/data/access";
import { byId } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tiến độ nhiệm vụ" };

/** Khung hiển thị (số năm). */
const SPANS = [1, 3, 5] as const;
/** Cửa sổ mốc "sắp đến hạn" (ngày). */
const SOON_DAYS = 30;

/** Màu thanh theo trạng thái (lớp tĩnh để Tailwind sinh được). */
const BAR_TONE: Record<string, string> = {
  "Đề xuất": "bg-slate-300 dark:bg-slate-600",
  "Đang xét duyệt": "bg-slate-400 dark:bg-slate-500",
  "Được phê duyệt": "bg-sky-400",
  "Đang thực hiện": "bg-primary",
  "Chờ nghiệm thu": "bg-amber-400",
  "Đã nghiệm thu": "bg-emerald-500",
  "Không phê duyệt": "bg-rose-200 dark:bg-rose-900",
  "Dừng": "bg-rose-300 dark:bg-rose-800",
};

/** M4.4 – Gantt nhiệm vụ KH&CN: thời gian thực hiện, tiến độ theo mốc, mốc trễ hạn. */
export default async function ResearchGanttPage({ searchParams }: { searchParams: Promise<{ from?: string; span?: string; scope?: string; level?: string }> }) {
  const sp = await searchParams;
  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const span = (SPANS as readonly number[]).includes(Number(sp.span)) ? Number(sp.span) : 3;
  const from = /^\d{4}$/.test(sp.from ?? "") ? Number(sp.from) : year - Math.floor(span / 2);
  const scope = sp.scope === "all" ? "all" : "active";
  const level = (TASK_LEVELS as readonly string[]).includes(sp.level ?? "") ? sp.level! : "";
  const [tasks, milestones, expenses, researchers, access] = await Promise.all([
    researchTaskStore.list(),
    taskMilestoneStore.list(),
    taskExpenseStore.list(),
    researcherStore.list(),
    currentAccess(),
  ]);
  const w = ganttWindow(from, from + span - 1);
  const researcherById = byId(researchers);
  const taskById = byId(tasks);
  const canWrite = access.can("write.research");

  const shown = tasks
    .filter((t) => (scope === "all" || ACTIVE_TASK.includes(t.status)) && (!level || t.level === level))
    .sort((a, b) => (a.startAt || "9999").localeCompare(b.startAt || "9999") || a.code.localeCompare(b.code));
  const rows: GanttRow[] = shown
    .map((t) => {
      const ms = milestones.filter((m) => m.taskId === t.id);
      const prog = milestoneProgress(ms, today);
      const alerts = taskAlerts(t, ms, expenses.filter((e) => e.taskId === t.id), today);
      return {
        id: t.id,
        href: `/research-tasks/${t.id}`,
        code: t.code,
        title: t.title,
        sub: [t.level, researcherById.get(t.leaderId)?.fullName, t.startAt && t.endAt ? `${fmtDateVN(t.startAt)} – ${fmtDateVN(t.endAt)}` : "chưa có thời gian"].filter(Boolean).join(" · "),
        status: t.status,
        bar: barPosition(t.startAt, t.endAt, w),
        progress: prog.pct,
        barTone: BAR_TONE[t.status] ?? "bg-primary",
        milestones: ms
          .filter((m) => m.dueAt && m.dueAt >= w.start && m.dueAt < w.end)
          .map((m) => ({ id: m.id, pos: w.pos(m.dueAt), title: `${m.title} – hạn ${fmtDateVN(m.dueAt)}${m.doneAt ? ` · xong ${fmtDateVN(m.doneAt)}` : ""}`, state: m.doneAt ? ("done" as const) : m.dueAt < today ? ("late" as const) : ("open" as const) })),
        alert: alerts.map((a) => `${a.kind} ${a.detail}`).join(", ") || undefined,
      };
    })
    .filter((r) => r.bar || r.milestones.length);
  const todayPos = today >= w.start && today < w.end ? w.pos(today) : null;

  const activeIds = new Set(tasks.filter((t) => ACTIVE_TASK.includes(t.status)).map((t) => t.id));
  const pending = milestones
    .filter((m) => !m.doneAt && m.dueAt && activeIds.has(m.taskId) && daysUntil(m.dueAt) <= SOON_DAYS)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const qs = (o: { from?: number; span?: number; scope?: string; level?: string }) => {
    const p = new URLSearchParams();
    p.set("from", String(o.from ?? from));
    p.set("span", String(o.span ?? span));
    if ((o.scope ?? scope) === "all") p.set("scope", "all");
    const lv = o.level ?? level;
    if (lv) p.set("level", lv);
    return `/research-gantt?${p}`;
  };
  const chip = (href: string, label: string, active: boolean) => (
    <Link key={href + label} href={href} className={cn("h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium", active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent")}>{label}</Link>
  );

  return (
    <>
      <Header title="Tiến độ nhiệm vụ" description="Biểu đồ Gantt các đề tài, dự án: thời gian thực hiện, % mốc hoàn thành, mốc trễ hạn, vạch hôm nay" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={qs({ from: from - 1 })} aria-label="Lùi 1 năm" className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-accent"><ChevronLeft className="h-4 w-4" /></Link>
          <span className="min-w-24 text-center text-sm font-semibold tabular-nums">{span === 1 ? from : `${from} – ${from + span - 1}`}</span>
          <Link href={qs({ from: from + 1 })} aria-label="Tiến 1 năm" className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-accent"><ChevronRight className="h-4 w-4" /></Link>
          {SPANS.map((s) => chip(qs({ span: s, from: year - Math.floor(s / 2) }), `${s} năm`, s === span))}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          {chip(qs({ scope: "active" }), "Đang triển khai", scope === "active")}
          {chip(qs({ scope: "all" }), "Tất cả trạng thái", scope === "all")}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          {chip(qs({ level: "" }), "Mọi cấp", !level)}
          {TASK_LEVELS.map((l) => chip(qs({ level: l }), l, level === l))}
        </div>
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-2">
            <GanttChart rows={rows} months={w.months} todayPos={todayPos} />
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              {Object.entries(BAR_TONE).filter(([s]) => scope === "all" || ACTIVE_TASK.includes(s)).map(([s, tone]) => <span key={s} className="inline-flex items-center gap-1"><span className={cn("h-2.5 w-4 rounded-sm", tone)} />{s}</span>)}
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rotate-45 border border-emerald-600 bg-emerald-500" />mốc xong</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rotate-45 border border-rose-600 bg-rose-500" />mốc trễ</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-px bg-rose-500" />hôm nay</span>
              <span>Phần đậm đầu thanh = % mốc đã hoàn thành.</span>
            </div>
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Flag className="h-4 w-4 text-primary" />Mốc cần hoàn thành</CardTitle>
              <CardDescription>Trễ hạn và đến hạn trong {SOON_DAYS} ngày của nhiệm vụ đang triển khai</CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có mốc cần xử lý.</p>
              ) : (
                <ul className="divide-y">
                  {pending.map((m) => {
                    const d = daysUntil(m.dueAt);
                    const t = taskById.get(m.taskId);
                    return (
                      <li key={m.id} className="flex items-start gap-2 py-2">
                        <div className="min-w-0 flex-1">
                          <Link href={`/research-tasks/${m.taskId}`} className="font-mono text-[11px] font-semibold text-primary hover:underline">{t?.code}</Link>
                          <div className="text-sm">{m.title}</div>
                          {m.deliverable && <div className="text-[11px] text-muted-foreground">Sản phẩm: {m.deliverable}</div>}
                          <div className={cn("text-[11px]", d < 0 ? "font-semibold text-rose-600" : "text-amber-700 dark:text-amber-400")}>{d < 0 ? `trễ ${-d} ngày` : d === 0 ? "đến hạn hôm nay" : `còn ${d} ngày`} · hạn {fmtDateVN(m.dueAt)}</div>
                        </div>
                        {canWrite && <ActionButton url={`/api/task-milestones/${m.id}`} method="PATCH" body={{ doneAt: today }} label="Xong" icon={<CheckCircle2 />} confirm={`Ghi nhận hoàn thành mốc “${m.title}” hôm nay?`} success="Đã ghi nhận mốc" />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
