import Link from "next/link";
import { CalendarRange, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmtDateVN } from "@/lib/platform/dates";
import { EmptyNote, fmtNum } from "./shared";

export type PipelineStage = { label: string; value: number; hint: string; href: string };
export type TrackTrial = { id: string; code: string; variety: string; kind: string; site: string; season: string; startAt: string; endAt: string; leader: string; progress: number | null };

/** Chuỗi khảo nghiệm → kiểm định → chứng nhận: các bước nối nhau bằng mũi tên. */
export function TrialPipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stages.map((s, i) => (
        <li key={s.label} className="relative">
          <Link href={s.href} className="flex h-full flex-col rounded-xl border border-border bg-accent/60 px-3 py-2.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Bước {i + 1}</span>
            <span className="text-2xl font-bold tabular-nums leading-tight">{fmtNum(s.value)}</span>
            <span className="text-xs font-medium leading-snug">{s.label}</span>
            <span className="text-[11px] text-muted-foreground">{s.hint}</span>
          </Link>
          {i < stages.length - 1 && (
            <ChevronRight className="absolute -right-2.5 top-1/2 z-[1] hidden h-5 w-5 -translate-y-1/2 rounded-full bg-card text-primary sm:block" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}

export function TrialTrack({ trials }: { trials: TrackTrial[] }) {
  if (trials.length === 0) return <EmptyNote>Không có khảo nghiệm nào đang theo dõi.</EmptyNote>;
  return (
    <ul className="divide-y divide-border">
      {trials.map((t) => (
        <li key={t.id}>
          <Link href={`/breed-trials/${t.id}`} className="group block py-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-[11px] font-semibold text-primary">{t.code}</span>
              <span className="text-sm font-medium group-hover:text-primary">{t.variety || "—"}</span>
              <Badge variant="outline" className="text-[10px] px-1.5">{t.kind}</Badge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
              <CalendarRange className="w-3 h-3" aria-hidden />
              <span>{fmtDateVN(t.startAt) || "?"} → {fmtDateVN(t.endAt) || "?"}</span>
              {[t.season, t.site, t.leader].filter(Boolean).map((x) => <span key={x}>· {x}</span>)}
            </div>
            {t.progress != null && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={t.progress} aria-label={`Tiến độ ${t.code}`}>
                  <div className={`h-full rounded-full ${t.progress >= 100 ? "bg-warning" : "bg-primary"}`} style={{ width: `${t.progress}%` }} />
                </div>
                <span className="w-16 text-right text-[11px] tabular-nums text-muted-foreground">{t.progress >= 100 ? "quá hạn" : `${t.progress}%`}</span>
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
