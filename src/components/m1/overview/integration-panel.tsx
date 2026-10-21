import { Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsolePanel, Readout } from "./console-panel";
import { StatusDot } from "./status-dot";
import { ago, type Level } from "./status";

export type ChannelRow = { name: string; desc: string; mode: string; level: Level; sent: number; errors: number; lastAt?: string };
export type HourBucket = { hour: string; total: number; denied: number };
export type MessageRow = { id: string; at: string; channel: string; direction: string; service: string; ok: boolean };

/** Bảng tích hợp: kênh LGSP/NDXP, khóa API, lưu lượng gọi API 24 giờ, thông điệp gần nhất. */
export function IntegrationPanel({
  channels,
  keysActive,
  keysTotal,
  calls24h,
  denied24h,
  hours,
  messages,
  now,
}: {
  channels: ChannelRow[];
  keysActive: number;
  keysTotal: number;
  calls24h: number;
  denied24h: number;
  hours: HourBucket[];
  messages: MessageRow[];
  now: number;
}) {
  const max = Math.max(1, ...hours.map((h) => h.total));
  const deniedPct = calls24h ? Math.round((denied24h / calls24h) * 100) : 0;
  return (
    <ConsolePanel title="Tích hợp & API" code="M1.3" icon={Network} href="/integration">
      <ul className="space-y-1.5">
        {channels.map((c) => (
          <li key={c.name} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
            <StatusDot level={c.level} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold">{c.name}</span>
                <span className={cn("text-[10px] rounded px-1 border", c.mode === "Thật" ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-400" : "border-amber-500/50 text-amber-700 dark:text-amber-400")}>{c.mode}</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{c.desc}</div>
            </div>
            <div className="text-right text-[10px] leading-tight shrink-0">
              <div><span className="font-mono font-semibold">{c.sent}</span> thông điệp{c.errors > 0 && <span className="text-red-700 dark:text-red-400"> · {c.errors} lỗi</span>}</div>
              <div className="text-muted-foreground">{ago(c.lastAt, now)}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Readout label="Khóa API hoạt động" value={`${keysActive}/${keysTotal}`} />
        <Readout label="Lượt gọi 24h" value={calls24h} />
        <Readout label="Từ chối / lỗi" value={`${deniedPct}%`} hint={`${denied24h} lượt`} tone={deniedPct >= 25 ? "text-amber-700 dark:text-amber-400" : undefined} />
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-[10px] text-muted-foreground"><span>Lưu lượng API theo giờ</span><span className="font-mono">24h</span></div>
        {hours.length === 0 ? (
          <div className="h-12 grid place-items-center text-[11px] text-muted-foreground border border-dashed rounded">Không có dữ liệu</div>
        ) : (
          <div role="img" aria-label={`${calls24h} lượt gọi API trong 24 giờ, ${denied24h} bị từ chối`} className="flex items-end gap-px h-12 border-b">
            {hours.map((h) => (
              <div key={h.hour} title={`${h.hour}: ${h.total} lượt · ${h.denied} từ chối`} className="flex-1 flex flex-col justify-end h-full">
                {h.denied > 0 && <div className="bg-red-500/80" style={{ height: `${(h.denied / max) * 100}%` }} />}
                <div className="bg-primary/70" style={{ height: `${((h.total - h.denied) / max) * 100}%`, minHeight: h.total ? 1 : 0 }} />
              </div>
            ))}
          </div>
        )}
        {hours.length > 0 && (
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-0.5"><span>{hours[0].hour}</span><span>{hours[hours.length - 1].hour}</span></div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Thông điệp gần nhất</div>
        {messages.length === 0 ? (
          <div className="text-xs text-muted-foreground">Chưa có thông điệp LGSP/NDXP</div>
        ) : (
          <ul className="divide-y text-[11px]">
            {messages.map((m) => (
              <li key={m.id} className="py-1 flex items-center gap-2 min-w-0">
                <StatusDot level={m.ok ? "ok" : "down"} className="size-2" />
                <span className="font-mono shrink-0">{m.channel}</span>
                <span aria-hidden className="text-muted-foreground shrink-0">{m.direction === "Gửi đi" ? "↑" : "↓"}</span>
                <span className="sr-only">{m.direction}</span>
                <span className="truncate flex-1">{m.service}</span>
                <span className="text-muted-foreground shrink-0">{ago(m.at, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ConsolePanel>
  );
}
