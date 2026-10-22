import { Database, DatabaseBackup, KeyRound, Network, RadioTower, ServerCrash, Waypoints } from "lucide-react";
import { Header } from "@/components/layout/header";
import { AdminLauncher, type LauncherStat } from "@/components/m1/overview/admin-launcher";
import { EventTimeline, type TimelineItem } from "@/components/m1/overview/event-timeline";
import { HealthStrip, SystemStatusBanner, type Subsystem } from "@/components/m1/overview/health-strip";
import { IntegrationPanel, type ChannelRow, type HourBucket } from "@/components/m1/overview/integration-panel";
import { SecurityPanel, type SecurityStats } from "@/components/m1/overview/security-panel";
import { ago, bytes, nowMs, worst, type Level } from "@/components/m1/overview/status";
import { incidentStore, type SystemIncident } from "@/lib/modules/m2/data/incidents";
import { isAuthConfigured } from "@/lib/platform/auth/server";
import { ENTITY_LABELS, listChanges } from "@/lib/platform/data/change-log";
import { apiCallStats, listApiClients, listMessages } from "@/lib/platform/data/integration";
import { listAuthEvents, securityCounters } from "@/lib/platform/data/security";
import { SETTINGS, getSetting, getSettings } from "@/lib/platform/data/settings";
import { listBackups, listHealth } from "@/lib/platform/data/system";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";
import { CHANNELS, OUTBOUND_SERVICES, channelMode } from "@/lib/platform/integration/lgsp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng quản trị" };

type Row = Record<string, unknown>;

/** Mọi nguồn số liệu đều có giá trị dự phòng: trang vẫn hiển thị khi CSDL / migration chưa sẵn sàng. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[executive]", (e as Error).message);
    return fallback;
  }
}

const hourVN = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

const incidentLevel = (i: SystemIncident): Level =>
  i.status === "Đã khắc phục" ? "ok" : i.status === "Mở" && (i.category === "Truy cập trái phép" || i.category === "Mất / sai dữ liệu") ? "down" : "warn";

/** M1 – bảng quản trị (chỉ vai trò Quản trị): sức khỏe hệ thống, tích hợp, an toàn thông tin, sự cố, chức năng quản trị. */
export default async function AdminConsolePage() {
  const now = nowMs();

  const [dbUp, health, backups, incidents, changes, sec, mfaRequired, authEvents, clients, callStats, hourly, messages, settings] =
    await Promise.all([
      safe(() => dbQuery(`select 1`).then(() => true), false),
      safe(() => listHealth(30), []),
      safe(() => listBackups(5), []),
      safe(() => incidentStore.list(), [] as SystemIncident[]),
      safe(() => listChanges({ limit: 12 }), []),
      safe(() => securityCounters(), null),
      safe(() => getSetting("mfa_required"), false),
      safe(() => listAuthEvents(6), []),
      safe(() => listApiClients(), []),
      safe(() => apiCallStats(), { total: 0, denied: 0 }),
      safe<Row[]>(
        () =>
          dbQuery(
            `select h, (select count(*)::int from public.api_calls where at >= h and at < h + interval '1 hour') total,
                    (select count(*)::int from public.api_calls where at >= h and at < h + interval '1 hour' and status >= 400) denied
             from generate_series(date_trunc('hour', now()) - interval '23 hours', date_trunc('hour', now()), interval '1 hour') h order by h`,
          ),
        [],
      ),
      safe(() => listMessages(50), []),
      safe(() => getSettings(), null),
    ]);

  const security: SecurityStats = sec ? { ...sec, mfaRequired } : null;

  // ── Sức khỏe từng thành phần ────────────────────────────────────
  const last = health[0];
  const ticks = [...health].reverse().map((h) => ({ at: h.at, ok: h.ok, dbMs: h.dbMs }));
  const okRate = health.length ? `${Math.round((health.filter((h) => h.ok).length / health.length) * 100)}%` : "—";
  const dbLevel: Level = !isDbConfigured() || !dbUp ? "down" : !last ? "idle" : !last.ok || last.dbMs > 1500 ? "warn" : "ok";
  const recent = (iso: string) => now - Date.parse(iso) < 86_400_000;

  const channelRows: ChannelRow[] = CHANNELS.map((ch) => {
    const mine = messages.filter((m) => m.channel === ch);
    const errors24 = mine.filter((m) => m.status === "Lỗi" && recent(m.at)).length;
    const mode = channelMode(ch);
    return {
      name: ch,
      desc: ch === "LGSP" ? "Nền tảng tích hợp, chia sẻ dữ liệu cấp tỉnh" : "Nền tảng tích hợp, chia sẻ dữ liệu quốc gia",
      mode,
      level: errors24 > 0 ? "down" : mode === "Thật" ? "ok" : "warn",
      sent: mine.length,
      errors: mine.filter((m) => m.status === "Lỗi").length,
      lastAt: mine[0]?.at,
    };
  });

  const activeKeys = clients.filter((c) => c.active).length;
  const deniedRatio = callStats.total ? callStats.denied / callStats.total : 0;
  const lastBackup = backups[0];
  const backupAge = lastBackup ? -daysUntil(lastBackup.at.slice(0, 10)) : NaN;
  const openIncidents = incidents.filter((i) => i.status !== "Đã khắc phục");
  const latestIncident = [...incidents].sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""))[0];
  const authOn = isAuthConfigured();

  const subsystems: Subsystem[] = [
    {
      key: "db",
      name: "Cơ sở dữ liệu",
      tech: "PostgreSQL trên Neon",
      icon: Database,
      level: dbLevel,
      state: !isDbConfigured() ? "Chưa cấu hình" : undefined,
      metric: last ? String(last.dbMs) : "—",
      metricLabel: "ms",
      lines: [
        { k: "Đạt", v: okRate },
        { k: "Dung lượng", v: bytes(Number(last?.detail.databaseBytes ?? 0)) },
      ],
      href: "/system",
    },
    {
      key: "auth",
      name: "Xác thực",
      tech: "Neon Auth và xác thực 2 lớp",
      icon: KeyRound,
      level: authOn ? (security && security.mfaFailed24h >= 5 ? "warn" : "ok") : "warn",
      state: authOn ? undefined : "Chưa cấu hình",
      metric: security ? String(security.activeSessions) : "—",
      metricLabel: "phiên",
      lines: [
        { k: "2 lớp", v: security ? `${security.mfaOn}/${security.accounts}` : "—" },
        { k: "Sai 24h", v: security ? String(security.mfaFailed24h) : "—" },
      ],
      href: "/security",
    },
    ...channelRows.map<Subsystem>((c) => ({
      key: c.name,
      name: c.name,
      tech: c.desc,
      icon: c.name === "LGSP" ? Network : RadioTower,
      level: c.level,
      state: c.level === "down" ? "Lỗi gửi 24h" : c.mode === "Mô phỏng" ? "Mô phỏng" : undefined,
      metric: String(c.sent),
      metricLabel: "thông điệp",
      lines: [
        { k: "Lỗi", v: String(c.errors) },
        { k: "Gần nhất", v: ago(c.lastAt, now) },
      ],
      href: "/integration",
    })),
    {
      key: "api",
      name: "API v1",
      tech: "Khóa API, phạm vi, giới hạn tần suất",
      icon: Waypoints,
      level: !activeKeys ? "idle" : deniedRatio >= 0.5 ? "down" : deniedRatio >= 0.25 ? "warn" : "ok",
      state: !activeKeys ? "Chưa cấp khóa" : undefined,
      metric: String(callStats.total),
      metricLabel: "lượt/24h",
      lines: [
        { k: "Từ chối", v: String(callStats.denied) },
        { k: "Khóa", v: `${activeKeys}/${clients.length}` },
      ],
      href: "/integration",
    },
    {
      key: "backup",
      name: "Sao lưu",
      tech: "Điểm khôi phục Neon và bản xuất JSON",
      icon: DatabaseBackup,
      level: !lastBackup ? "warn" : backupAge <= 7 ? "ok" : backupAge <= 30 ? "warn" : "down",
      state: !lastBackup ? "Chưa xuất" : undefined,
      metric: lastBackup ? String(Math.max(0, backupAge)) : "—",
      metricLabel: "ngày trước",
      lines: [
        { k: "Bản xuất", v: backups.length >= 5 ? "5+" : String(backups.length) },
        { k: "Kích thước", v: bytes(lastBackup?.bytes ?? 0) },
      ],
      href: "/system",
    },
    {
      key: "incidents",
      name: "Sự cố HTTT",
      tech: "Sổ sự cố hệ thống thông tin",
      icon: ServerCrash,
      level: openIncidents.length ? worst(openIncidents.map(incidentLevel)) : "ok",
      state: openIncidents.length ? undefined : "Không có sự cố mở",
      metric: String(openIncidents.length),
      metricLabel: "đang mở",
      lines: [
        { k: "Tổng", v: String(incidents.length) },
        { k: "Gần nhất", v: latestIncident ? fmtDateVN(latestIncident.occurredAt) || "—" : "—" },
      ],
      href: "/system-incidents",
    },
  ];
  const overall = worst(subsystems.map((s) => s.level));

  // ── Dòng thời gian sự cố + thay đổi ─────────────────────────────
  const timeline: TimelineItem[] = [
    ...incidents.map<TimelineItem>((i) => ({
      id: i.id,
      kind: "incident",
      at: i.occurredAt || "",
      title: `${i.code} · ${i.category}`,
      detail: i.description,
      actor: i.detectedBy,
      level: incidentLevel(i),
      status: i.status,
      href: "/system-incidents",
    })),
    ...changes.map<TimelineItem>((c) => ({
      id: c.id,
      kind: "change",
      at: c.at,
      title: `${c.action} · ${ENTITY_LABELS[c.entity] ?? c.entity}`,
      detail: [c.label, c.changes.length ? `${c.changes.length} trường thay đổi` : ""].filter(Boolean).join(" · "),
      actor: c.actor,
      level: "ok",
      href: "/change-log",
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  const hours: HourBucket[] = hourly.map((h) => ({ hour: hourVN(String(h.h)), total: Number(h.total), denied: Number(h.denied) }));

  // ── Dòng trạng thái trên lưới chức năng quản trị ────────────────
  const settingsSet = settings ? Object.keys(settings._meta).length : NaN;
  const launcher: Record<string, LauncherStat> = {
    "/security": sec ? { text: `${sec.mfaOn}/${sec.accounts} tài khoản bật 2 lớp${mfaRequired ? " · bắt buộc" : ""}`, tone: mfaRequired || sec.mfaOn >= sec.accounts ? "ok" : "warn" } : { text: "chưa có số liệu" },
    "/integration": { text: `${activeKeys}/${clients.length} khóa API · ${callStats.total} lượt 24h${callStats.denied ? ` · ${callStats.denied} bị chặn` : ""}`, tone: callStats.denied ? "warn" : "muted" },
    "/system": last ? { text: `${last.ok ? "Tốt" : "Lỗi"} · kiểm tra ${ago(last.at, now)}${lastBackup ? ` · sao lưu ${ago(lastBackup.at, now)}` : " · chưa sao lưu"}`, tone: !last.ok ? "down" : !lastBackup || backupAge > 30 ? "warn" : "ok" } : { text: "chưa kiểm tra sức khỏe", tone: "warn" },
    "/system-incidents": openIncidents.length ? { text: `${openIncidents.length} sự cố đang mở`, tone: openIncidents.some((i) => incidentLevel(i) === "down") ? "down" : "warn" } : { text: "Không có sự cố mở", tone: "ok" },
    "/change-log": changes[0] ? { text: `gần nhất ${ago(changes[0].at, now)} · ${changes[0].actor || "hệ thống"}` } : { text: "chưa có thay đổi" },
    "/settings": { text: Number.isNaN(settingsSet) ? "chưa đọc được" : `${settingsSet}/${Object.keys(SETTINGS).length} tham số đã đặt` },
  };

  return (
    <>
      <Header title="Bảng quản trị hệ thống" description="Dành cho quản trị viên: sức khỏe hệ thống, tích hợp LGSP/NDXP, an toàn thông tin, sự cố, sao lưu và các chức năng quản trị" />
      <main className="relative flex-1 overflow-y-auto scrollbar-thin">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[900px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative p-3 sm:p-6 space-y-4">
          <SystemStatusBanner
            level={overall}
            ticks={ticks}
            lastAt={last?.at}
            meta={[
              { k: "Vùng", v: String(last?.detail.region ?? "—") },
              { k: "Phiên bản", v: String(last?.detail.commit ?? "—") },
              { k: "Nguồn", v: last?.source ?? "—" },
            ]}
          />

          <HealthStrip items={subsystems} />

          <AdminLauncher stats={launcher} />

          <section aria-label="Tích hợp, an toàn thông tin, sự cố" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            <IntegrationPanel
              channels={channelRows}
              keysActive={activeKeys}
              keysTotal={clients.length}
              calls24h={callStats.total}
              denied24h={callStats.denied}
              hours={hours}
              messages={messages.slice(0, 4).map((m) => ({
                id: m.id,
                at: m.at,
                channel: m.channel,
                direction: m.direction,
                service: OUTBOUND_SERVICES[m.service as keyof typeof OUTBOUND_SERVICES] ?? m.service,
                ok: m.status !== "Lỗi",
              }))}
              now={now}
            />
            <SecurityPanel stats={security} events={authEvents.map((e) => ({ id: e.id, at: e.at, email: e.email, event: e.event }))} now={now} />
            <EventTimeline items={timeline} openIncidents={openIncidents.length} />
          </section>

        </div>
      </main>
    </>
  );
}
