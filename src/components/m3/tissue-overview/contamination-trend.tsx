import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { fmtPct } from "@/lib/modules/m3/rates";
import type { MonthRate } from "./types";

type Props = {
  months: MonthRate[];
  overall: number | null;
  vessels: number;
  contaminated: number;
  /** Chênh lệch điểm % giữa nửa sau và nửa đầu của kỳ (null nếu thiếu dữ liệu). */
  delta: number | null;
  threshold: number;
};

/** Tỷ lệ nhiễm của kỳ gần đây kèm biểu đồ cột theo tháng (SVG thuần) và vạch ngưỡng. */
export function ContaminationTrend({ months, overall, vessels, contaminated, delta, threshold }: Props) {
  const over = overall != null && overall > threshold;
  const W = 240, H = 96, PAD = 4;
  const max = Math.max(threshold * 1.6, ...months.map((m) => m.rate ?? 0), 1);
  const bw = (W - PAD * 2) / Math.max(1, months.length);
  const y = (v: number) => H - (v / max) * H;
  const Trend = delta == null || Math.abs(delta) < 0.5 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const trendText =
    delta == null ? "chưa đủ dữ liệu so sánh" : Math.abs(delta) < 0.5 ? "gần như không đổi" : `${delta > 0 ? "tăng" : "giảm"} ${Math.abs(delta).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} điểm %`;

  return (
    <section aria-labelledby="contam-title" className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="contam-title" className="text-base font-semibold">Tỷ lệ nhiễm mẫu</h2>
          <p className="text-xs text-muted-foreground">{months.length} tháng gần nhất · theo ngày cấy</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${over ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
          {overall == null ? "Chưa có dữ liệu" : over ? "Vượt ngưỡng" : "Trong ngưỡng"}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-4xl font-semibold tabular-nums ${over ? "text-rose-600 dark:text-rose-400" : "text-primary"}`}>{fmtPct(overall)}</span>
        <span className="text-xs text-muted-foreground">{contaminated.toLocaleString("vi-VN")}/{vessels.toLocaleString("vi-VN")} bình</span>
      </div>
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Trend className={`h-3.5 w-3.5 ${delta != null && delta >= 0.5 ? "text-rose-600" : delta != null && delta <= -0.5 ? "text-emerald-600" : ""}`} aria-hidden />
        3 tháng gần nhất so với 3 tháng trước: {trendText}
      </p>

      <figure className="mt-4">
        <svg viewBox={`0 0 ${W} ${H + 16}`} className="h-auto w-full" role="img" aria-label={`Tỷ lệ nhiễm theo tháng: ${months.map((m) => `${m.label} ${fmtPct(m.rate)}`).join(", ")}; ngưỡng ${threshold}%`}>
          {months.map((m, i) => {
            const v = m.rate ?? 0;
            const x = PAD + i * bw + bw * 0.18;
            const w = bw * 0.64;
            const bad = m.rate != null && m.rate > threshold;
            return (
              <g key={m.key}>
                <title>{`${m.label}: ${fmtPct(m.rate)} (${m.contaminated}/${m.vessels} bình)`}</title>
                {m.rate == null ? (
                  <rect x={x} y={H - 2} width={w} height={2} rx={1} className="fill-muted" />
                ) : (
                  <rect x={x} y={y(v)} width={w} height={Math.max(2, H - y(v))} rx={3} className={bad ? "fill-rose-500" : "fill-primary/70"} />
                )}
                <text x={x + w / 2} y={H + 12} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>{m.label}</text>
              </g>
            );
          })}
          <line x1={0} x2={W} y1={y(threshold)} y2={y(threshold)} strokeDasharray="4 3" strokeWidth={1} className="stroke-foreground/50" />
          <text x={W - 2} y={y(threshold) - 3} textAnchor="end" fontSize={9} className="fill-muted-foreground">ngưỡng {threshold}%</text>
        </svg>
        <figcaption className="sr-only">Cột đỏ là tháng vượt ngưỡng cảnh báo; tháng không có mẻ cấy hiện vạch mờ.</figcaption>
      </figure>

      <div className="mt-auto pt-3">
        <Link href="/tissue-stats" className="text-xs font-medium text-primary hover:underline">Phân tích theo tủ cấy, người thao tác, lô môi trường →</Link>
      </div>
    </section>
  );
}
