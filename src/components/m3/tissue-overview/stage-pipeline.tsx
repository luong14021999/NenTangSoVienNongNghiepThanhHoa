import Link from "next/link";
import { ChevronRight, FlaskConical, Sprout, Truck } from "lucide-react";
import type { PipelineItem, PipelineStage } from "./types";

/** Nền cột theo bậc đậm dần của màu phân hệ (lớp tĩnh để Tailwind sinh được). */
const STAGE_TINT = ["bg-primary/[0.04]", "bg-primary/[0.07]", "bg-primary/10", "bg-primary/[0.13]", "bg-primary/[0.16]", "bg-primary/20", "bg-primary/25"];
const STAGE_DOT = ["bg-primary/40", "bg-primary/50", "bg-primary/60", "bg-primary/70", "bg-primary/80", "bg-primary/90", "bg-primary"];

const GROUP_ICON = { invitro: FlaskConical, nursery: Sprout, out: Truck } as const;
const GROUP_LABEL = { invitro: "Trong phòng nuôi (in vitro)", nursery: "Vườn ươm", out: "Đầu ra" } as const;

const dueTone = { red: "text-rose-600 dark:text-rose-400 font-medium", amber: "text-amber-700 dark:text-amber-400 font-medium", muted: "text-muted-foreground" };

function VesselCard({ item }: { item: PipelineItem }) {
  const fill = Math.max(0, Math.min(100, item.fill ?? 0));
  return (
    <li>
      <Link
        href={item.href}
        className="group relative block overflow-hidden rounded-2xl rounded-t-[1.25rem] border border-border bg-card px-3 pt-2.5 pb-2 shadow-sm transition hover:border-primary/50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* "Môi trường" dâng trong bình theo tiến độ chu kỳ */}
        {item.fill != null && (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 bg-primary/[0.08] transition-[height]" style={{ height: `${fill}%` }} />
        )}
        <span className="relative flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-primary group-hover:underline">{item.code}</span>
          {item.due && <span className={`text-[11px] whitespace-nowrap ${dueTone[item.due.tone]}`}>{item.due.label}</span>}
        </span>
        <span className="relative block truncate text-xs font-medium" title={item.title}>{item.title || "Chưa rõ giống"}</span>
        <span className="relative mt-0.5 block text-[11px] leading-snug text-muted-foreground">{item.facts.filter(Boolean).join(" · ")}</span>
      </Link>
    </li>
  );
}

/** Bảng dây chuyền: các cột giai đoạn nối tiếp nhau, mỗi cột có số tổng và vài thẻ "bình cấy". */
export function StagePipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <section aria-labelledby="pipeline-title" className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 id="pipeline-title" className="text-base font-semibold">Dây chuyền sản xuất in vitro</h2>
          <p className="text-xs text-muted-foreground">Từ vào mẫu đến xuất bán – thẻ được sắp theo hạn gần nhất; mức tô trong thẻ là tiến độ chu kỳ cấy</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          {(Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[]).map((g) => {
            const Icon = GROUP_ICON[g];
            return <span key={g} className="inline-flex items-center gap-1"><Icon className="h-3.5 w-3.5 text-primary" aria-hidden />{GROUP_LABEL[g]}</span>;
          })}
        </div>
      </div>
      <ol className="flex snap-x snap-mandatory gap-0 overflow-x-auto p-3 sm:p-4 scrollbar-thin">
        {stages.map((s, i) => {
          const Icon = GROUP_ICON[s.group];
          const shown = s.items.length;
          return (
            <li key={s.key} className="flex shrink-0 snap-start items-stretch">
              <div className={`flex w-[15.5rem] flex-col rounded-2xl border border-primary/15 ${STAGE_TINT[Math.min(i, STAGE_TINT.length - 1)]} p-3`}>
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${STAGE_DOT[Math.min(i, STAGE_DOT.length - 1)]} text-primary-foreground`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      <span className="mr-1 text-muted-foreground tabular-nums">{i + 1}.</span>{s.name}
                    </h3>
                    <p className="truncate text-[11px] text-muted-foreground">{s.hint}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tabular-nums text-primary">{s.primary.value.toLocaleString("vi-VN")}</span>
                  <span className="text-xs text-muted-foreground">{s.primary.unit}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{s.secondary}</p>
                {shown === 0 ? (
                  <p className="mt-3 flex-1 rounded-xl border border-dashed border-primary/25 px-3 py-4 text-center text-xs text-muted-foreground">{s.emptyText}</p>
                ) : (
                  <ul className="mt-3 flex-1 space-y-2" aria-label={`${s.name}: ${s.total} mục`}>
                    {s.items.map((it) => <VesselCard key={it.id} item={it} />)}
                  </ul>
                )}
                <Link href={s.moreHref} className="mt-2 text-[11px] font-medium text-primary hover:underline">
                  {s.total > shown ? `+ ${s.total - shown} mục khác – xem tất cả →` : "Xem danh sách →"}
                </Link>
              </div>
              {i < stages.length - 1 && (
                <span aria-hidden className="flex w-6 shrink-0 items-center justify-center text-primary/50">
                  <ChevronRight className="h-5 w-5" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
