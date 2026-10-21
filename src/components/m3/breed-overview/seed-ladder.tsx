import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { fmtNum, qtyByUnit } from "./shared";

export type LadderStep = {
  label: string;
  hint?: string;
  /** Số lô giống (hoặc số đàn/vườn với bước nguồn gốc). */
  lots: number;
  certified: number;
  /** Lô sản xuất đang làm ở cấp này. */
  producing: number;
  quantities: { quantity: number; unit: string }[];
  href: string;
};

/** Bậc thang cấp giống: mỗi bậc một thanh ngang tỉ lệ số lô – đọc từ trên (cấp cao) xuống (cấp thương phẩm). */
export function SeedLadder({ title, icon: Icon, steps }: { title: string; icon: LucideIcon; steps: LadderStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.lots));
  const total = steps.reduce((a, s) => a + s.lots, 0);
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="w-4 h-4 text-primary" aria-hidden /> {title}
        <span className="ml-auto text-[11px] font-normal text-muted-foreground">{fmtNum(total)} lô</span>
      </h3>
      <ol className="relative space-y-3">
        {steps.map((s, i) => {
          const pct = Math.round((s.lots / max) * 100);
          const qty = qtyByUnit(s.quantities);
          return (
            <li key={s.label} className="relative grid grid-cols-[1.75rem_1fr] gap-2.5">
              {i < steps.length - 1 && <span className="absolute left-[0.8rem] top-7 bottom-[-0.75rem] w-px bg-primary/25" aria-hidden />}
              <span className="z-[1] grid place-items-center w-7 h-7 rounded-full border-2 border-primary bg-card text-[11px] font-bold text-primary" aria-hidden>{i + 1}</span>
              <Link href={s.href} className="group min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="text-xs font-semibold group-hover:text-primary">{s.label}{s.hint && <span className="ml-1 font-normal text-muted-foreground">· {s.hint}</span>}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{fmtNum(s.lots)} lô{s.certified > 0 && ` · ${fmtNum(s.certified)} đạt/chứng nhận`}</span>
                </div>
                <div
                  className="mt-1 h-3 overflow-hidden rounded-full bg-primary/10"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-valuenow={s.lots}
                  aria-label={`${s.label}: ${s.lots} lô`}
                >
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${s.lots ? Math.max(pct, 4) : 0}%` }} />
                </div>
                <div className="mt-0.5 flex flex-wrap justify-between gap-x-2 text-[11px] text-muted-foreground">
                  <span>{qty || "chưa có sản lượng"}</span>
                  {s.producing > 0 && <span className="text-primary">{fmtNum(s.producing)} lô đang sản xuất</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
