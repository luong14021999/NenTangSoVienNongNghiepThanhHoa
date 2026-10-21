import Link from "next/link";
import { BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

export type OverviewAlert = { href: string; code: string; who: string; text: string; tone: "red" | "amber" };

const OPEN_LIMIT = 5;

/** Cảnh báo thời hạn – 5 mục đầu hiển thị sẵn, còn lại thu gọn. */
export function AlertsPanel({ alerts }: { alerts: OverviewAlert[] }) {
  const red = alerts.filter((a) => a.tone === "red").length;
  const row = (a: OverviewAlert, i: number) => (
    <li key={`${a.code}-${i}`} className="flex items-start gap-2 py-2">
      <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.tone === "red" ? "bg-rose-500" : "bg-amber-400")} />
      <span className="min-w-0 text-xs">
        <Link href={a.href} className="font-mono text-primary hover:underline">{a.code}</Link>{" "}
        <span>{a.text}</span>
        {a.who && <span className="text-muted-foreground"> · {a.who}</span>}
        <span className="sr-only">{a.tone === "red" ? " (khẩn)" : " (lưu ý)"}</span>
      </span>
    </li>
  );
  return (
    <section aria-labelledby="alerts-title" className="rounded-xl border border-border bg-card p-4">
      <h2 id="alerts-title" className="flex items-center gap-2 text-sm font-semibold">
        <BellRing className="h-4 w-4 text-primary" aria-hidden />
        Cần xử lý
        <span className="ml-auto flex gap-1 text-[11px] font-medium">
          {red > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{red} khẩn</span>}
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{alerts.length}</span>
        </span>
      </h2>
      <ul className="mt-1 divide-y divide-border">
        {alerts.slice(0, OPEN_LIMIT).map(row)}
        {alerts.length === 0 && <li className="py-4 text-center text-xs text-muted-foreground">Không có việc tồn đọng</li>}
      </ul>
      {alerts.length > OPEN_LIMIT && (
        <details className="group">
          <summary className="cursor-pointer list-none pt-2 text-xs font-medium text-primary hover:underline">
            <span className="group-open:hidden">Xem thêm {alerts.length - OPEN_LIMIT} cảnh báo</span>
            <span className="hidden group-open:inline">Thu gọn</span>
          </summary>
          <ul className="divide-y divide-border">{alerts.slice(OPEN_LIMIT, 60).map((a, i) => row(a, i + OPEN_LIMIT))}</ul>
        </details>
      )}
    </section>
  );
}
