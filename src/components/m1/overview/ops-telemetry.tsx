import Link from "next/link";
import { cn } from "@/lib/utils";

export type Kpi = { label: string; value: string; hint?: string; alert?: boolean; href?: string };

/** Bảng đọc chỉ số dạng lưới liền khối (không phải thẻ rời), số monospace. */
export function KpiReadout({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-px rounded-lg border bg-border shadow-sm overflow-hidden">
      {items.map((k) => {
        const body = (
          <>
            <span className="block text-[11px] text-muted-foreground leading-tight">{k.label}</span>
            <span className={cn("block font-mono text-lg sm:text-xl font-semibold tabular-nums leading-tight mt-0.5", k.alert && "text-amber-700 dark:text-amber-400")}>{k.value}</span>
            {k.hint && <span className="block text-[10px] text-muted-foreground truncate">{k.hint}</span>}
          </>
        );
        const cls = "block bg-card p-2.5 min-w-0";
        return k.href ? (
          <Link key={k.label} href={k.href} className={cn(cls, "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}>{body}</Link>
        ) : (
          <div key={k.label} className={cls}>{body}</div>
        );
      })}
    </div>
  );
}

/** Biểu đồ cột tháng gọn; cột tháng hiện tại được nhấn mạnh. */
export function MiniBars({ months, values, fmt = String, label }: { months: string[]; values: number[]; fmt?: (n: number) => string; label: string }) {
  const max = Math.max(1, ...values);
  const total = values.reduce((s, v) => s + v, 0);
  return (
    <div>
      <div role="img" aria-label={`${label}: tổng ${fmt(total)} trong ${months.length} tháng`} className="relative flex items-end gap-1 h-28 border-b">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2].map((g) => <div key={g} className="border-t border-dashed border-border/70" />)}
        </div>
        {months.map((m, i) => (
          <div key={m} title={`${m.slice(5)}/${m.slice(0, 4)}: ${fmt(values[i])}`} className="relative flex-1 min-w-0 h-full flex items-end">
            <div
              className={cn("w-full rounded-t-sm", i === months.length - 1 ? "bg-primary" : "bg-primary/45")}
              style={{ height: `${(values[i] / max) * 100}%`, minHeight: values[i] ? 2 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-0.5">
        {months.map((m, i) => (
          <span key={m} className={cn("flex-1 min-w-0 text-center font-mono text-[9px] text-muted-foreground", i % 2 === 1 && "max-sm:invisible")}>{m.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

/** Thanh ngang tỷ trọng. */
export function ShareBars({ rows }: { rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <div className="text-xs text-muted-foreground">Chưa có dữ liệu</div>;
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,7rem)_1fr_2.5rem] sm:grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-2 text-[11px]">
          <span className="truncate" title={r.label}>{r.label}</span>
          <span className="h-1.5 rounded-full bg-muted overflow-hidden"><span className="block h-full rounded-full bg-primary" style={{ width: `${(r.n / max) * 100}%` }} /></span>
          <span className="font-mono text-right tabular-nums">{r.n}</span>
        </li>
      ))}
    </ul>
  );
}
