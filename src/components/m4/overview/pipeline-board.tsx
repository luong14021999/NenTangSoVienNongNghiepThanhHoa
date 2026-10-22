import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { compactVND, initials } from "./format";

export type Deal = {
  id: string;
  href: string;
  code: string;
  customer: string;
  service: string;
  /** Giá trị (VND); null = chưa định giá (yêu cầu mới). */
  value: number | null;
  /** Nhãn số liệu thay cho giá trị khi chưa định giá, VD "12 mẫu". */
  valueHint?: string;
  /** Số ngày tuổi của giao dịch ở cột hiện tại. */
  age: number;
  /** Nhãn tuổi, VD "quá hạn 12 ngày". Mặc định "<age> ngày". */
  ageLabel?: string;
  /** Ngưỡng cảnh báo tuổi (ngày): [vàng, đỏ]. */
  ageWarn?: [number, number];
  /** Ghi đè màu nhãn tuổi (VD hợp đồng trễ hạn trả kết quả). */
  tone?: "danger" | "warn" | "muted";
  owner: string;
  status?: string;
};

export type PipelineColumn = {
  key: string;
  title: string;
  hint: string;
  icon: LucideIcon;
  href: string;
  count: number;
  /** Tổng giá trị; null = cột không có giá trị tiền. */
  total: number | null;
  totalLabel?: string;
  /** Phân rã nhỏ theo trạng thái, VD Nháp 2 · Chờ duyệt 1. */
  breakdown?: { label: string; count: number }[];
  deals: Deal[];
};

const MAX_DEALS = 4;

function AgeBadge({ deal }: { deal: Deal }) {
  if (!Number.isFinite(deal.age) && !deal.ageLabel) return null;
  const [warn, danger] = deal.ageWarn ?? [7, 14];
  const level = deal.tone ?? (deal.age >= danger ? "danger" : deal.age >= warn ? "warn" : "muted");
  const tone =
    level === "danger"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
      : level === "warn"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums", tone)}>
      {deal.ageLabel ?? (deal.age <= 0 ? "hôm nay" : `${deal.age} ngày`)}
    </span>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <li>
      <Link
        href={deal.href}
        className="group block rounded-lg border border-border bg-card p-3 shadow-xs transition hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
          >
            {initials(deal.customer)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{deal.customer || "(chưa gắn khách hàng)"}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{deal.service || "—"}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {deal.value !== null ? (
              <p className="text-base font-bold tabular-nums tracking-tight text-foreground">{compactVND(deal.value)}</p>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground">{deal.valueHint ?? "Chưa báo giá"}</p>
            )}
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {deal.code}
              {deal.status ? ` · ${deal.status}` : ""}
            </p>
          </div>
          <AgeBadge deal={deal} />
        </div>
        {deal.owner && (
          <p className="mt-2 truncate border-t border-border pt-2 text-[11px] text-muted-foreground">
            Phụ trách: <span className="text-foreground">{deal.owner}</span>
          </p>
        )}
      </Link>
    </li>
  );
}

/** Bảng quy trình bán hàng – chỉ đọc, bấm thẻ để mở hồ sơ. */
export function PipelineBoard({ columns }: { columns: PipelineColumn[] }) {
  const maxTotal = Math.max(1, ...columns.map((c) => c.total ?? 0));
  return (
    <section aria-labelledby="pipeline-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="pipeline-title" className="text-base font-semibold">Phễu bán hàng dịch vụ</h2>
          <p className="text-xs text-muted-foreground">Từ yêu cầu của khách đến thu đủ tiền · bấm thẻ để mở hồ sơ</p>
        </div>
        <p className="text-xs text-muted-foreground sm:hidden">Vuốt ngang để xem các bước →</p>
      </div>
      <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin sm:mx-0 sm:px-0">
        {columns.map((col) => {
          const share = col.total !== null ? Math.max(4, Math.round(((col.total ?? 0) / maxTotal) * 100)) : 0;
          return (
            <li
              key={col.key}
              aria-label={`${col.title}: ${col.count}`}
              className="flex w-[82vw] max-w-[19rem] shrink-0 snap-start flex-col rounded-xl border border-border bg-muted/40 sm:w-72 2xl:w-auto 2xl:min-w-60 2xl:max-w-none 2xl:flex-1"
            >
              <header className="space-y-2 rounded-t-xl border-b border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <Link href={col.href} className="flex min-w-0 items-center gap-2 hover:text-primary">
                    <span className="h-5 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span className="truncate text-sm font-semibold">{col.title}</span>
                  </Link>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold tabular-nums text-primary-foreground">{col.count}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-bold tabular-nums tracking-tight">
                    {col.total !== null ? compactVND(col.total) : "—"}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">{col.totalLabel ?? col.hint}</span>
                </div>
                {col.total !== null && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                )}
                {col.breakdown && col.breakdown.some((b) => b.count > 0) && (
                  <p className="flex flex-wrap gap-1">
                    {col.breakdown.filter((b) => b.count > 0).map((b) => (
                      <span key={b.label} className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">
                        {b.label} <b className="tabular-nums">{b.count}</b>
                      </span>
                    ))}
                  </p>
                )}
              </header>
              <ul className="flex flex-1 flex-col gap-2 p-2">
                {col.deals.slice(0, MAX_DEALS).map((d) => (
                  <DealCard key={d.id} deal={d} />
                ))}
                {col.deals.length === 0 && (
                  <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">Trống</li>
                )}
              </ul>
              {col.count > MAX_DEALS && (
                <Link href={col.href} className="flex items-center justify-center gap-1 border-t border-border py-2 text-xs font-medium text-primary hover:underline">
                  Xem tất cả {col.count} <ChevronRight className="h-3 w-3" aria-hidden />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
