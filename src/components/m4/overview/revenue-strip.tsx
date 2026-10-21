import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { compactVND, deltaPct } from "./format";

export type RevenueStripData = {
  monthLabel: string;
  month: number;
  prevMonth: number;
  yearLabel: string;
  ytd: number;
  prevYtd: number;
  /** Thu theo tháng của năm nay (12 phần tử). */
  monthly: number[];
  currentMonthIndex: number;
  debt: number;
  overdueDebt: number;
  debtContracts: number;
  /** Tỷ lệ báo giá → chấp nhận (%), null nếu chưa có báo giá đã kết thúc. */
  winRate: number | null;
  won: number;
  decided: number;
  /** Số báo giá chấp nhận đã có hợp đồng. */
  wonWithContract: number;
};

function Delta({ cur, prev, label }: { cur: number; prev: number; label: string }) {
  const d = deltaPct(cur, prev);
  if (d === null) return <span className="text-[11px] text-muted-foreground">{label}: chưa có số liệu</span>;
  const Icon = d > 0 ? TrendingUp : d < 0 ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium tabular-nums",
        d > 0 ? "text-emerald-700 dark:text-emerald-400" : d < 0 ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {d > 0 ? "+" : ""}
      {d.toLocaleString("vi-VN")}% <span className="font-normal text-muted-foreground">{label} ({compactVND(prev)})</span>
    </span>
  );
}

/** Dải doanh thu: tiền đã thu, công nợ, tỷ lệ chốt báo giá. */
export function RevenueStrip({ data }: { data: RevenueStripData }) {
  const max = Math.max(1, ...data.monthly);
  const overduePct = data.debt > 0 ? Math.round((data.overdueDebt / data.debt) * 100) : 0;
  return (
    <section aria-label="Doanh thu và công nợ" className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-4">
      <div className="border-b border-r border-border p-4 lg:border-b-0">
        <p className="text-xs text-muted-foreground">Đã thu {data.monthLabel}</p>
        <p className="mt-1 text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{compactVND(data.month)}</p>
        <Delta cur={data.month} prev={data.prevMonth} label="so tháng trước" />
      </div>
      <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Đã thu {data.yearLabel}</p>
            <p className="mt-1 text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{compactVND(data.ytd)}</p>
          </div>
          <div className="hidden h-10 items-end gap-0.5 sm:flex" aria-hidden title="Tiền thu theo tháng">
            {data.monthly.map((v, i) => (
              <span
                key={i}
                className={cn("w-1.5 rounded-sm", i === data.currentMonthIndex ? "bg-primary" : i < data.currentMonthIndex ? "bg-primary/40" : "bg-muted")}
                style={{ height: `${Math.max(6, Math.round((v / max) * 100))}%` }}
              />
            ))}
          </div>
        </div>
        <Delta cur={data.ytd} prev={data.prevYtd} label="cùng kỳ" />
      </div>
      <Link href="/payments" className="group border-r border-border p-4 hover:bg-accent/50">
        <p className="text-xs text-muted-foreground">Công nợ phải thu</p>
        <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-rose-700 dark:text-rose-400 sm:text-2xl">{compactVND(data.debt)}</p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full bg-rose-500" style={{ width: `${overduePct}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {data.debtContracts} HĐ · quá hạn <span className="font-medium text-foreground">{compactVND(data.overdueDebt)}</span>
        </p>
      </Link>
      <Link href="/quotations" className="p-4 hover:bg-accent/50">
        <p className="text-xs text-muted-foreground">Tỷ lệ chốt báo giá · 12 tháng</p>
        <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-primary sm:text-2xl">
          {data.winRate === null ? "—" : `${data.winRate.toLocaleString("vi-VN")}%`}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {data.won}/{data.decided} báo giá được chấp nhận · {data.wonWithContract} đã có hợp đồng
        </p>
      </Link>
    </section>
  );
}
