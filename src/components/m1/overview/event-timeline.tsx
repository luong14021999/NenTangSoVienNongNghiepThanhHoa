import Link from "next/link";
import { History, ServerCrash, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDateTimeVN, fmtDateVN } from "@/lib/platform/dates";
import { ConsolePanel } from "./console-panel";
import { LEVEL_DOT, LEVEL_TEXT, type Level } from "./status";

export type TimelineItem = {
  id: string;
  kind: "incident" | "change";
  /** ISO timestamp (thay đổi) hoặc "YYYY-MM-DD" (sự cố). */
  at: string;
  title: string;
  detail: string;
  actor: string;
  level: Level;
  status?: string;
  href: string;
};

/** Dòng thời gian hợp nhất: sự cố hệ thống thông tin + nhật ký thay đổi dữ liệu. */
export function EventTimeline({ items, openIncidents }: { items: TimelineItem[]; openIncidents: number }) {
  return (
    <ConsolePanel
      title="Sự cố & thay đổi"
      code="M1.8"
      icon={History}
      href="/change-log"
      hrefLabel="Nhật ký"
      aside={
        <Link href="/system-incidents" className={cn("font-mono text-[10px] rounded-full px-1.5 py-px border", openIncidents ? "border-red-500/50 text-red-700 dark:text-red-400" : "text-muted-foreground")}>
          {openIncidents} sự cố mở
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">Chưa có sự cố hay thay đổi nào được ghi nhận</div>
      ) : (
        <ol className="relative ml-1.5 border-l border-border space-y-3 py-1">
          {items.map((it) => {
            const Icon = it.kind === "incident" ? ServerCrash : PencilLine;
            return (
              <li key={it.kind + it.id} className="relative pl-4 min-w-0">
                <span aria-hidden className={cn("absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-2 ring-card", it.kind === "incident" ? LEVEL_DOT[it.level] : "bg-primary")} />
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                  <time dateTime={it.at}>{it.kind === "incident" ? fmtDateVN(it.at) : fmtDateTimeVN(it.at)}</time>
                  {it.actor && <span className="truncate font-sans">· {it.actor}</span>}
                </div>
                <Link href={it.href} className="group flex items-start gap-1.5 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  <Icon aria-hidden className={cn("size-3.5 mt-0.5 shrink-0", it.kind === "incident" ? LEVEL_TEXT[it.level] : "text-primary")} />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium leading-snug group-hover:underline">
                      {it.title}
                      {it.status && <span className={cn("ml-1.5 text-[10px] font-normal", LEVEL_TEXT[it.level])}>[{it.status}]</span>}
                    </span>
                    {it.detail && <span className="block text-[11px] text-muted-foreground leading-snug line-clamp-2">{it.detail}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </ConsolePanel>
  );
}
