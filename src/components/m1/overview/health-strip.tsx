import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDateTimeVN } from "@/lib/platform/dates";
import { StatusDot } from "./status-dot";
import { LEVEL_LABEL, LEVEL_TEXT, type Level } from "./status";

export type Subsystem = {
  key: string;
  name: string;
  tech: string;
  icon: LucideIcon;
  level: Level;
  /** Nhãn trạng thái riêng (VD "Mô phỏng"); mặc định theo mức. */
  state?: string;
  metric: string;
  metricLabel: string;
  lines: { k: string; v: string }[];
  href: string;
};

export type HealthTick = { at: string; ok: boolean; dbMs: number };

const BANNER: Record<Level, { title: string; ring: string }> = {
  ok: { title: "Mọi phân hệ dùng chung hoạt động bình thường", ring: "border-emerald-500/40" },
  warn: { title: "Có thành phần cần chú ý", ring: "border-amber-500/50" },
  down: { title: "Có thành phần gián đoạn – cần xử lý", ring: "border-red-500/50" },
  idle: { title: "Chưa đủ dữ liệu giám sát", ring: "border-border" },
};

/** Băng trạng thái tổng + dải kiểm tra sức khỏe gần nhất (mỗi vạch = một lần kiểm tra). */
export function SystemStatusBanner({
  level,
  ticks,
  lastAt,
  meta,
}: {
  level: Level;
  ticks: HealthTick[];
  lastAt?: string;
  meta: { k: string; v: string }[];
}) {
  const okCount = ticks.filter((t) => t.ok).length;
  const uptime = ticks.length ? `${((okCount / ticks.length) * 100).toFixed(okCount === ticks.length ? 0 : 1)}%` : "—";
  const slots = 30;
  const padded: (HealthTick | null)[] = [...Array(Math.max(0, slots - ticks.length)).fill(null), ...ticks.slice(-slots)];
  return (
    <section aria-label="Trạng thái tổng của nền tảng" className={cn("rounded-lg border-2 bg-card/95 backdrop-blur-sm p-3 sm:p-4 shadow-sm", BANNER[level].ring)}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
        <div className="flex items-start gap-3 min-w-0 lg:w-[34%]">
          <StatusDot level={level} className="mt-1.5 size-3" />
          <div className="min-w-0">
            <div className={cn("font-mono text-[11px] uppercase tracking-widest", LEVEL_TEXT[level])}>{LEVEL_LABEL[level]}</div>
            <p className="font-semibold leading-snug">{BANNER[level].title}</p>
            <p className="text-xs text-muted-foreground">Kiểm tra gần nhất: <span className="font-mono">{fmtDateTimeVN(lastAt)}</span></p>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between text-[11px] text-muted-foreground mb-1">
            <span>Kiểm tra sức khỏe · {ticks.length} lần gần nhất</span>
            <span>Sẵn sàng <span className="font-mono font-semibold text-foreground">{uptime}</span></span>
          </div>
          <div role="img" aria-label={`${okCount} trên ${ticks.length} lần kiểm tra đạt`} className="flex items-end gap-[2px] h-8">
            {padded.map((t, i) => (
              <span
                key={t ? t.at : `pad-${i}`}
                title={t ? `${fmtDateTimeVN(t.at)} · ${t.ok ? "Tốt" : "Lỗi"} · CSDL ${t.dbMs} ms` : "Chưa có dữ liệu"}
                className={cn("flex-1 rounded-[2px]", t ? (t.ok ? "bg-emerald-500/80" : "bg-red-500") : "bg-muted")}
                style={{ height: t ? `${Math.max(35, Math.min(100, 35 + (t.dbMs / 1500) * 65))}%` : "35%" }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-0.5"><span>cũ hơn</span><span>mới nhất</span></div>
        </div>
        <dl className="grid grid-cols-3 lg:grid-cols-1 gap-x-4 gap-y-0.5 text-[11px] lg:w-44 shrink-0">
          {meta.map((m) => (
            <div key={m.k} className="flex flex-col lg:flex-row lg:justify-between gap-x-2 min-w-0">
              <dt className="text-muted-foreground">{m.k}</dt>
              <dd className="font-mono truncate">{m.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Dải ô từng thành phần hệ thống: chấm trạng thái, chỉ số chính, chi tiết rút gọn. */
export function HealthStrip({ items }: { items: Subsystem[] }) {
  return (
    <ul aria-label="Tình trạng từng thành phần" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
      {items.map((s) => (
        <li key={s.key} className="min-w-0">
          <Link
            href={s.href}
            className={cn(
              "group relative flex h-full flex-col gap-1.5 overflow-hidden rounded-lg border bg-card/95 p-2.5 shadow-sm transition-colors hover:border-primary/60 hover:bg-accent/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span aria-hidden className={cn("absolute inset-x-0 top-0 h-0.5", s.level === "ok" ? "bg-emerald-500" : s.level === "warn" ? "bg-amber-500" : s.level === "down" ? "bg-red-500" : "bg-muted")} />
            <div className="flex items-center gap-1.5 min-w-0">
              <s.icon aria-hidden className="size-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold truncate">{s.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusDot level={s.level} label={false} />
              <span className={cn("text-[11px] font-medium", LEVEL_TEXT[s.level])}>{s.state ?? LEVEL_LABEL[s.level]}</span>
            </div>
            <div className="font-mono text-xl font-semibold tabular-nums leading-none">
              {s.metric}
              <span className="ml-1 text-[10px] font-sans font-normal text-muted-foreground">{s.metricLabel}</span>
            </div>
            <dl className="mt-auto space-y-px text-[10px] leading-tight">
              {s.lines.map((l) => (
                <div key={l.k} className="flex justify-between gap-2 min-w-0">
                  <dt className="text-muted-foreground shrink-0">{l.k}</dt>
                  <dd className="font-mono truncate text-right">{l.v}</dd>
                </div>
              ))}
            </dl>
            <span className="sr-only">{s.tech}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
