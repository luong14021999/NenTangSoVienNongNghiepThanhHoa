import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsolePanel, Readout } from "./console-panel";
import { StatusDot } from "./status-dot";
import { ago, type Level } from "./status";

export type SecurityStats = {
  accounts: number;
  mfaOn: number;
  mfaRequired: boolean;
  activeSessions: number;
  mfaFailed24h: number;
  apiDenied24h: number;
  changes24h: number;
  rbacEnabled: boolean;
} | null;

export type AuthEventRow = { id: string; at: string; email: string; event: string };

/** Mức cảnh báo của một sự kiện xác thực. */
export function authEventLevel(event: string): Level {
  if (/khóa/i.test(event)) return "down";
  if (/sai/i.test(event)) return "warn";
  if (/^Gỡ|Đặt lại/i.test(event)) return "warn";
  return "ok";
}

/** Vòng tỷ lệ bật xác thực 2 lớp. */
function MfaRing({ on, total }: { on: number; total: number }) {
  const pct = total ? on / total : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" role="img" aria-label={`${on} trên ${total} tài khoản đã bật xác thực 2 lớp`}>
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${pct * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-sm font-bold tabular-nums">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  );
}

/** Bảng an toàn thông tin: mức phủ 2 lớp, phiên, cảnh báo 24 giờ, sự kiện xác thực gần nhất. */
export function SecurityPanel({ stats, events, now }: { stats: SecurityStats; events: AuthEventRow[]; now: number }) {
  return (
    <ConsolePanel title="An toàn thông tin" code="M1.7" icon={ShieldCheck} href="/security">
      {!stats ? (
        <div className="text-xs text-muted-foreground">Không đọc được số liệu bảo mật (CSDL chưa sẵn sàng).</div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <MfaRing on={stats.mfaOn} total={stats.accounts} />
            <div className="min-w-0 text-xs space-y-0.5">
              <div className="font-semibold">Xác thực 2 lớp</div>
              <div className="text-muted-foreground"><span className="font-mono text-foreground">{stats.mfaOn}/{stats.accounts}</span> tài khoản đã bật</div>
              <div className="text-muted-foreground">Chính sách: <span className="text-foreground">{stats.mfaRequired ? "bắt buộc" : "tự nguyện"}</span></div>
              <div className="flex items-center gap-1.5">
                <StatusDot level={stats.rbacEnabled ? "ok" : "warn"} label={false} className="size-2" />
                <span>Phân quyền theo vai trò: {stats.rbacEnabled ? "đang bật" : "chưa bật"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 rounded-md border p-2">
            <Readout label="Phiên đang hoạt động" value={stats.activeSessions} />
            <Readout label="Mã 2 lớp sai · 24h" value={stats.mfaFailed24h} tone={stats.mfaFailed24h > 0 ? "text-amber-700 dark:text-amber-400" : undefined} />
            <Readout label="API bị từ chối · 24h" value={stats.apiDenied24h} tone={stats.apiDenied24h > 0 ? "text-amber-700 dark:text-amber-400" : undefined} />
            <Readout label="Thay đổi dữ liệu · 24h" value={stats.changes24h} />
          </div>
        </>
      )}
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sự kiện xác thực gần nhất</div>
        {events.length === 0 ? (
          <div className="text-xs text-muted-foreground">Chưa có sự kiện</div>
        ) : (
          <ul className="divide-y text-[11px]">
            {events.map((e) => {
              const lv = authEventLevel(e.event);
              return (
                <li key={e.id} className="py-1 flex items-center gap-2 min-w-0">
                  <StatusDot level={lv} className="size-2" />
                  <span className={cn("shrink-0", lv !== "ok" && "font-medium")}>{e.event}</span>
                  <span className="truncate flex-1 text-muted-foreground font-mono">{e.email}</span>
                  <span className="text-muted-foreground shrink-0">{ago(e.at, now)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ConsolePanel>
  );
}
