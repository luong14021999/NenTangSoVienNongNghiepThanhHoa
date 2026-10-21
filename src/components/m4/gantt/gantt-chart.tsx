import Link from "next/link";
import { cn } from "@/lib/utils";

export type GanttMilestone = { id: string; pos: number; title: string; state: "done" | "late" | "open" };
export type GanttRow = {
  id: string;
  href: string;
  code: string;
  title: string;
  sub: string;
  status: string;
  bar: { left: number; width: number; clippedStart: boolean; clippedEnd: boolean } | null;
  /** % mốc đã hoàn thành – tô đậm phần đầu thanh. */
  progress: number;
  barTone: string;
  milestones: GanttMilestone[];
  alert?: string;
};
export type GanttMonth = { key: string; label: string; left: number; width: number; yearStart: boolean };

const msTone = { done: "bg-emerald-500 border-emerald-600", late: "bg-rose-500 border-rose-600", open: "bg-background border-foreground/50" };

/** Biểu đồ Gantt: cột trái tên nhiệm vụ, bên phải thanh thời gian + mốc (hình thoi) + vạch hôm nay. */
export function GanttChart({ rows, months, todayPos }: { rows: GanttRow[]; months: GanttMonth[]; todayPos: number | null }) {
  const years = months.filter((m) => m.yearStart);
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card scrollbar-thin">
      <div className="min-w-[60rem]">
        <div className="sticky top-0 z-10 grid grid-cols-[18rem_minmax(0,1fr)] border-b bg-muted/40 text-[11px] text-muted-foreground">
          <div className="border-r px-3 py-1.5 font-medium">Nhiệm vụ</div>
          <div className="relative h-11">
            {years.map((y) => (
              <span key={y.key} className="absolute top-0.5 border-l px-1 font-semibold text-foreground" style={{ left: `${y.left}%` }}>{y.key.slice(0, 4)}</span>
            ))}
            {months.map((m) => (
              <span key={m.key} className={cn("absolute bottom-0.5 text-center", months.length > 24 && "hidden")} style={{ left: `${m.left}%`, width: `${m.width}%` }}>{m.label}</span>
            ))}
          </div>
        </div>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Không có nhiệm vụ trong khung thời gian này</p>}
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[18rem_minmax(0,1fr)] border-b last:border-b-0 hover:bg-accent/30">
              <Link href={r.href} className="min-w-0 border-r px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-semibold text-primary">{r.code}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{r.status}</span>
                </div>
                <div className="truncate text-xs font-medium" title={r.title}>{r.title}</div>
                <div className="truncate text-[11px] text-muted-foreground">{r.sub}{r.alert && <span className="font-medium text-rose-600"> · {r.alert}</span>}</div>
              </Link>
              <div className="relative">
                {months.map((m) => (
                  <span key={m.key} aria-hidden className={cn("absolute inset-y-0 border-l", m.yearStart ? "border-border" : "border-border/40")} style={{ left: `${m.left}%` }} />
                ))}
                {todayPos != null && <span aria-hidden className="absolute inset-y-0 z-[1] w-px bg-rose-500" style={{ left: `${todayPos}%` }} />}
                {r.bar && (
                  <span
                    className={cn("absolute top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded", r.barTone, r.bar.clippedStart && "rounded-l-none", r.bar.clippedEnd && "rounded-r-none")}
                    style={{ left: `${r.bar.left}%`, width: `max(${r.bar.width}%, 4px)` }}
                    title={`${r.code}: ${r.progress}% mốc hoàn thành`}
                  >
                    <span className="block h-full bg-black/20 dark:bg-white/25" style={{ width: `${r.progress}%` }} />
                  </span>
                )}
                {r.milestones.map((m) => (
                  <span key={m.id} title={m.title} className={cn("absolute top-1/2 z-[2] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border", msTone[m.state])} style={{ left: `${m.pos}%` }} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
