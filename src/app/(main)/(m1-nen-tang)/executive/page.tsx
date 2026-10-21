import { Activity, BarChart3, Database, DatabaseBackup, KeyRound, Layers, Network, RadioTower, ServerCrash, Waypoints } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ConsolePanel } from "@/components/m1/overview/console-panel";
import { EventTimeline, type TimelineItem } from "@/components/m1/overview/event-timeline";
import { HealthStrip, SystemStatusBanner, type Subsystem } from "@/components/m1/overview/health-strip";
import { IntegrationPanel, type ChannelRow, type HourBucket } from "@/components/m1/overview/integration-panel";
import { ModulePulse, type Pulse } from "@/components/m1/overview/module-pulse";
import { KpiReadout, MiniBars, ShareBars } from "@/components/m1/overview/ops-telemetry";
import { SecurityPanel, type SecurityStats } from "@/components/m1/overview/security-panel";
import { ago, bytes, nowMs, vnd, worst, type Level } from "@/components/m1/overview/status";
import { incidentStore, type SystemIncident } from "@/lib/modules/m2/data/incidents";
import { isAuthConfigured } from "@/lib/platform/auth/server";
import { ENTITY_LABELS, listChanges } from "@/lib/platform/data/change-log";
import { apiCallStats, listApiClients, listMessages } from "@/lib/platform/data/integration";
import { listAuthEvents, securityCounters } from "@/lib/platform/data/security";
import { getSetting } from "@/lib/platform/data/settings";
import { listBackups, listHealth } from "@/lib/platform/data/system";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";
import { CHANNELS, OUTBOUND_SERVICES, channelMode } from "@/lib/platform/integration/lgsp";
import { lastMonths } from "@/lib/platform/stats";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng điều hành" };

const REV = `status in ('KH chấp nhận', 'Đã ký HĐ', 'Đã nhận mẫu')`;
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

/** M1.5 Bảng điều hành – trung tâm giám sát nền tảng dùng chung và nhịp các phân hệ. */
export default async function ExecutivePage() {
  const now = nowMs();
  const today = todayISO();
  const year = today.slice(0, 4);
  const months = lastMonths(today, 12);

  const [dbUp, health, backups, incidents, changes, sec, mfaRequired, authEvents, clients, callStats, hourly, messages, kpiRows, monthly, byType, pulseRows] =
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
      safe<Row[]>(
        () =>
          dbQuery(
            `select
               (select count(*)::int from analytics.fact_samples where to_char(received_at, 'YYYY') = $1) samples_year,
               (select count(*)::int from analytics.fact_samples where first_issued_at is null) samples_open,
               (select percentile_cont(0.5) within group (order by tat_days) from analytics.fact_samples where tat_days is not null) tat_median,
               (select round(100.0 * count(*) filter (where on_time) / nullif(count(*) filter (where on_time is not null), 0)) from analytics.fact_samples) on_time_pct,
               (select coalesce(sum(total), 0) from analytics.fact_revenue where ${REV} and left(month, 4) = $1) revenue_year,
               (select count(*)::int from analytics.fact_nonconformities where status is distinct from 'Đã đóng') nc_open,
               (select count(*)::int from analytics.fact_equipment where status is distinct from 'Ngừng' and days_to_calibration <= 30) eq_due,
               (select count(*)::int from analytics.fact_chemicals where low_stock or days_to_expiry <= 30) chem_alert,
               (select round(100.0 * count(*) filter (where quality in ('Tốt', 'Khá')) / nullif(count(*), 0)) from analytics.fact_feedback) satisfaction,
               (select count(*)::int from analytics.fact_feedback where is_complaint) complaints`,
            [year],
          ),
        [],
      ),
      safe<Row[]>(
        () =>
          dbQuery(
            `select m as month,
               (select count(*)::int from analytics.fact_samples where to_char(received_at, 'YYYY-MM') = m) samples,
               (select coalesce(sum(total), 0) from analytics.fact_revenue where ${REV} and month = m) revenue
             from unnest($1::text[]) m`,
            [months],
          ),
        [],
      ),
      safe<Row[]>(() => dbQuery(`select coalesce(nullif(type, ''), 'Khác') type, count(*)::int n from analytics.fact_samples group by 1 order by 2 desc limit 6`), []),
      // Bảng M3/M4 ở schema riêng (migration 0015) – chưa chạy migration thì chip vẫn hiện, chỉ thiếu số.
      safe<Row[]>(
        () =>
          dbQuery(
            `select
               (select count(*)::int from m4.service_requests where status = 'Mới tiếp nhận') requests_new,
               (select count(*)::int from m4.contracts where status in ('Đã ký', 'Đang thực hiện')) contracts_open,
               (select count(*)::int from m3_tissue.culture_batches where status = 'Đang nuôi') batches_growing,
               (select count(*)::int from m3_breed.varieties) varieties`,
          ),
        [],
      ),
    ]);

  const security: SecurityStats = sec ? { ...sec, mfaRequired } : null;
  const k: Row = kpiRows[0] ?? {};
  const n: Row = pulseRows[0] ?? {};
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? NaN : Number(v));
  const show = (v: unknown, suffix = "") => (Number.isNaN(num(v)) ? "—" : `${num(v)}${suffix}`);

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

  const pulse: Pulse[] = [
    { code: "M2", name: "Phòng thí nghiệm (LIMS)", value: show(k.samples_open), label: "mẫu chưa trả kết quả", href: "/lims" },
    { code: "M4", name: "Nghiên cứu – dịch vụ KH&CN", value: show(n.requests_new), label: "yêu cầu dịch vụ mới", href: "/m4-overview" },
    { code: "M4", name: "Hợp đồng dịch vụ", value: show(n.contracts_open), label: "hợp đồng đang thực hiện", href: "/contracts" },
    { code: "M3.1", name: "Nuôi cấy mô & truy xuất nguồn gốc", value: show(n.batches_growing), label: "mẻ cấy đang nuôi", href: "/tissue-overview" },
    { code: "M3.2", name: "Giống cây trồng, vật nuôi, thủy sản", value: show(n.varieties), label: "giống trong lý lịch", href: "/breed-overview" },
  ];

  const sampleSeries = months.map((m) => Number(monthly.find((r) => r.month === m)?.samples ?? 0));
  const revenueSeries = months.map((m) => Number(monthly.find((r) => r.month === m)?.revenue ?? 0));

  return (
    <>
      <Header title="Bảng thông tin điều hành" description="M1.5 – trung tâm giám sát nền tảng dùng chung: sức khỏe hệ thống, tích hợp, an toàn thông tin, sự cố và nhịp các phân hệ" />
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
          <ModulePulse items={pulse} />

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

          <section aria-labelledby="ops-kpi" className="space-y-2">
            <h2 id="ops-kpi" className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Activity aria-hidden className="size-4 text-primary" /> Chỉ số nghiệp vụ toàn Viện
              <span className="font-mono text-[10px] font-normal text-muted-foreground border rounded px-1">kho dữ liệu · analytics</span>
            </h2>
            <KpiReadout
              items={[
                { label: `Mẫu năm ${year}`, value: show(k.samples_year), hint: `${show(k.samples_open)} chưa trả kết quả`, href: "/data-warehouse" },
                { label: `Doanh thu ${year}`, value: Number.isNaN(num(k.revenue_year)) ? "—" : vnd(num(k.revenue_year) / 1e6), hint: "triệu VNĐ, gồm VAT" },
                { label: "TAT trung vị", value: show(k.tat_median), hint: "ngày" },
                { label: "Trả đúng hạn", value: show(k.on_time_pct, "%") },
                { label: "Không phù hợp đang mở", value: show(k.nc_open), alert: num(k.nc_open) > 0 },
                { label: "Thiết bị đến hạn HC", value: show(k.eq_due), hint: "trong 30 ngày", alert: num(k.eq_due) > 0 },
                { label: "Cảnh báo hóa chất", value: show(k.chem_alert), hint: "tồn thấp / sắp hết hạn", alert: num(k.chem_alert) > 0 },
                { label: "Hài lòng khá–tốt", value: show(k.satisfaction, "%"), hint: `${show(k.complaints)} khiếu nại` },
              ]}
            />
          </section>

          <section aria-label="Biểu đồ 12 tháng" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ConsolePanel title="Mẫu tiếp nhận · 12 tháng" icon={BarChart3} href="/forecast" hrefLabel="Dự báo">
              <MiniBars label="Mẫu tiếp nhận" months={months} values={sampleSeries} />
              <div className="mt-1 text-[11px] text-muted-foreground">Tháng này: <span className="font-mono text-foreground">{sampleSeries[sampleSeries.length - 1]}</span> mẫu</div>
            </ConsolePanel>
            <ConsolePanel title="Doanh thu · 12 tháng" icon={BarChart3}>
              <MiniBars label="Doanh thu" months={months} values={revenueSeries} fmt={(v) => `${vnd(v / 1e6)} triệu VNĐ`} />
              <div className="mt-1 text-[11px] text-muted-foreground">Tháng này: <span className="font-mono text-foreground">{vnd(revenueSeries[revenueSeries.length - 1] / 1e6)}</span> triệu VNĐ (phiếu yêu cầu được chấp nhận)</div>
            </ConsolePanel>
            <ConsolePanel title="Cơ cấu mẫu theo loại" icon={Layers} className="md:col-span-2 xl:col-span-1" href="/data-warehouse" hrefLabel="Kho dữ liệu">
              <ShareBars rows={byType.map((t) => ({ label: String(t.type), n: Number(t.n) }))} />
            </ConsolePanel>
          </section>
        </div>
      </main>
    </>
  );
}
