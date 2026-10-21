import Link from "next/link";
import { Beaker, ClipboardList, Repeat, Sprout } from "lucide-react";
import type { TodoItem } from "./types";

const KIND = {
  transfer: { icon: Repeat, label: "Cấy chuyển", href: "/culture-batches" },
  media: { icon: Beaker, label: "Môi trường", href: "/media-batches" },
  nursery: { icon: Sprout, label: "Vườn ươm", href: "/seedling-lots" },
  order: { icon: ClipboardList, label: "Đơn hàng", href: "/seedling-orders" },
} as const;

const TONE = {
  red: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-700 dark:text-amber-400",
  muted: "text-muted-foreground",
};

/** Danh sách "Việc cần làm" gom từ mẻ cấy, lô môi trường, lô vườn ươm, đơn hàng. */
export function TodoList({ items, limit = 10 }: { items: TodoItem[]; limit?: number }) {
  const counts = (Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => ({ k, n: items.filter((x) => x.kind === k).length }));
  const shown = items.slice(0, limit);
  return (
    <section aria-labelledby="todo-title" className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="todo-title" className="text-base font-semibold">Việc cần làm</h2>
          <p className="text-xs text-muted-foreground">Quá hạn trước, sau đó theo hạn gần nhất</p>
        </div>
        <ul className="flex flex-wrap gap-1.5" aria-label="Số việc theo nhóm">
          {counts.map(({ k, n }) => {
            const Icon = KIND[k].icon;
            return (
              <li key={k}>
                <Link href={KIND[k].href} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${n ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                  <Icon className="h-3 w-3" aria-hidden />{KIND[k].label}<span className="font-semibold tabular-nums">{n}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 flex-1 rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">Không có việc đến hạn – dây chuyền đang chạy đúng lịch.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {shown.map((t) => {
            const Icon = KIND[t.kind].icon;
            return (
              <li key={t.id}>
                <Link href={t.href} className="flex items-start gap-3 rounded-lg px-1 py-2.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm"><span className="font-mono text-xs font-semibold">{t.code}</span> <span className="text-muted-foreground">·</span> {t.text}</span>
                  </span>
                  <span className={`shrink-0 text-xs whitespace-nowrap ${TONE[t.tone]} ${t.tone !== "muted" ? "font-medium" : ""}`}>{t.when}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {items.length > shown.length && (
        <p className="mt-2 text-[11px] text-muted-foreground">Còn {items.length - shown.length} việc khác – xem theo nhóm ở trên hoặc <Link href="/production-schedule" className="text-primary hover:underline">lịch điều độ</Link>.</p>
      )}
    </section>
  );
}
