import Link from "next/link";
import { Globe, Inbox, MessageSquareReply, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "./format";

export type InboxItem = {
  id: string;
  code: string;
  contactName: string;
  orgName: string;
  kind: string;
  targetUnit: string;
  channel: string;
  description: string;
  age: number;
};

/** Hộp thư yêu cầu mới từ cổng công khai, chờ phản hồi. */
export function PortalInbox({ items, total, slaDays }: { items: InboxItem[]; total: number; slaDays: number }) {
  const late = items.filter((i) => i.age >= slaDays).length;
  return (
    <section aria-labelledby="inbox-title" className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Inbox className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="inbox-title" className="text-sm font-semibold">Hộp thư cổng dịch vụ</h2>
            <p className="truncate text-xs text-muted-foreground">
              {total} yêu cầu chờ phản hồi{late > 0 ? ` · ${late} quá ${slaDays} ngày` : ""}
            </p>
          </div>
        </div>
        <Link href="/request-inbox" className="shrink-0 text-xs font-medium text-primary hover:underline">Tất cả</Link>
      </header>
      <ul className="divide-y divide-border">
        {items.map((r) => {
          const overdue = r.age >= slaDays;
          const ChannelIcon = r.channel === "Trực tuyến" ? Globe : Phone;
          return (
            <li key={r.id} className={cn("flex gap-3 p-3 sm:p-4", overdue && "bg-rose-50/60 dark:bg-rose-500/5")}>
              <span aria-hidden className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(r.orgName || r.contactName)}
                {overdue && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-card" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{r.orgName || r.contactName}</p>
                  <span className={cn("shrink-0 text-[11px] tabular-nums", overdue ? "font-semibold text-rose-700 dark:text-rose-400" : "text-muted-foreground")}>
                    {r.age <= 0 ? "Hôm nay" : `${r.age} ngày trước`}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {r.orgName ? `${r.contactName} · ` : ""}
                  {r.kind}
                </p>
                {r.description && <p className="mt-1 line-clamp-2 text-xs">{r.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <ChannelIcon className="h-3 w-3" aria-hidden />
                    {r.channel}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">{r.targetUnit}</span>
                  <Link
                    href={`/request-inbox?box=all&id=${r.id}`}
                    className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Phản hồi yêu cầu ${r.code}`}
                  >
                    <MessageSquareReply className="h-3.5 w-3.5" aria-hidden />
                    Phản hồi
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Không có yêu cầu nào chờ phản hồi</li>}
      </ul>
    </section>
  );
}
