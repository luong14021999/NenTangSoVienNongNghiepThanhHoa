import Link from "next/link";
import { Droplets, Sun, Thermometer, WifiOff } from "lucide-react";
import { fmtDateTimeVN } from "@/lib/platform/dates";
import type { RoomMetric, RoomTile } from "./types";

const STATE = {
  ok: { label: "Trong ngưỡng", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900" },
  out: { label: "Ngoài ngưỡng", cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900" },
  stale: { label: "Mất tín hiệu", cls: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" },
  none: { label: "Chưa có số liệu", cls: "bg-muted text-muted-foreground border-border" },
} as const;

const ICONS = { "Nhiệt độ": Thermometer, "Độ ẩm": Droplets, "Ánh sáng": Sun } as Record<string, typeof Thermometer>;

/** Thanh ngưỡng: dải [min, max] tô màu phân hệ, vạch là giá trị đo mới nhất. */
function MetricBar({ m, dim }: { m: RoomMetric; dim: boolean }) {
  const Icon = ICONS[m.label] ?? Thermometer;
  const hasRange = m.max > m.min;
  const span = hasRange ? m.max - m.min : 1;
  const lo = m.min - span * 0.5;
  const hi = m.max + span * 0.5;
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const fmt = (v: number) => v.toLocaleString("vi-VN");
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-muted-foreground"><Icon className="h-3.5 w-3.5" aria-hidden />{m.label}</span>
        <span className={`tabular-nums ${m.out ? "font-semibold text-rose-600 dark:text-rose-400" : dim ? "text-muted-foreground" : "font-medium"}`}>
          {m.value == null ? "—" : `${fmt(m.value)} ${m.unit}`}
        </span>
      </div>
      <div
        className="relative mt-1 h-1.5 rounded-full bg-muted"
        role="img"
        aria-label={`${m.label}: ${m.value == null ? "chưa có số liệu" : `${fmt(m.value)} ${m.unit}`}, ngưỡng ${fmt(m.min)}–${fmt(m.max)} ${m.unit}${m.out ? ", ngoài ngưỡng" : ""}`}
      >
        {hasRange && <span className="absolute inset-y-0 rounded-full bg-primary/25" style={{ left: `${pos(m.min)}%`, width: `${pos(m.max) - pos(m.min)}%` }} />}
        {m.value != null && hasRange && (
          <span
            className={`absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card ${m.out ? "bg-rose-500" : dim ? "bg-muted-foreground" : "bg-primary"}`}
            style={{ left: `${pos(m.value)}%` }}
          />
        )}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">ngưỡng {fmt(m.min)}–{fmt(m.max)} {m.unit}</div>
    </div>
  );
}

/** Ô phòng nuôi: nhiệt độ – độ ẩm – ánh sáng mới nhất so với ngưỡng, cảnh báo mất tín hiệu. */
export function GrowthRoomTiles({ rooms, staleHours }: { rooms: RoomTile[]; staleHours: number }) {
  return (
    <section aria-labelledby="rooms-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="rooms-title" className="text-base font-semibold">Phòng nuôi</h2>
          <p className="text-xs text-muted-foreground">Lần đo mới nhất từ thiết bị (hạng mục I.1.4) hoặc nhập tay; quá {staleHours} giờ không có số liệu coi như mất tín hiệu</p>
        </div>
        <Link href="/growth-rooms" className="text-xs font-medium text-primary hover:underline">Tủ cấy & phòng nuôi →</Link>
      </div>
      {rooms.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          Chưa có phòng nuôi. <Link href="/growth-rooms" className="text-primary hover:underline">Thêm phòng nuôi</Link> để theo dõi điều kiện nuôi cấy.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rooms.map((r) => {
            const st = STATE[r.state];
            const dim = r.state === "stale";
            return (
              <li key={r.id}>
                <Link
                  href={`/growth-rooms/${r.id}`}
                  className={`block h-full rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${r.state === "out" ? "border-rose-300 dark:border-rose-900" : r.state === "stale" ? "border-amber-300 dark:border-amber-900" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-primary">{r.code}</div>
                      <div className="truncate text-sm font-medium">{r.name}</div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
                      {r.state === "stale" && <WifiOff className="h-3 w-3" aria-hidden />}
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {r.metrics.map((m) => <MetricBar key={m.label} m={m} dim={dim} />)}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-x-2 gap-y-0.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    <span>{r.lastAt ? `${fmtDateTimeVN(r.lastAt)}${r.source ? ` · ${r.source}` : ""}` : r.deviceCode ? `Thiết bị ${r.deviceCode}` : "Chưa gắn thiết bị"}</span>
                    <span>{r.batches} mẻ đang nuôi{r.photoperiod ? ` · ${r.photoperiod}` : ""}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
