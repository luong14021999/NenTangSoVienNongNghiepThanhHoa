import { Header } from "@/components/layout/header";
import { StagePipeline } from "@/components/m3/tissue-overview/stage-pipeline";
import { GrowthRoomTiles } from "@/components/m3/tissue-overview/growth-room-tiles";
import { ContaminationTrend } from "@/components/m3/tissue-overview/contamination-trend";
import { TodoList } from "@/components/m3/tissue-overview/todo-list";
import type { MonthRate, PipelineItem, PipelineStage, RoomTile, TodoItem } from "@/components/m3/tissue-overview/types";
import {
  CULTURE_STAGES,
  cabinetStore,
  cultureBatchStore,
  growthRoomStore,
  latestReadings,
  lotSaleStore,
  mediaBatchStore,
  seedlingLotStore,
  seedlingOrderStore,
  tissueMaterialStore,
  type CultureBatch,
  type RoomReading,
} from "@/lib/modules/m3/data/tissue";
import { orderProgress } from "@/lib/modules/m3/production";
import { pct } from "@/lib/modules/m3/rates";
import { DEFAULT_CONTAMINATION_THRESHOLD, isStaleReading, lineage, readingAlerts } from "@/lib/modules/m3/tissue-rules";
import { getSetting } from "@/lib/platform/data/settings";
import { byId } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dây chuyền nuôi cấy" };

/** Số liệu đo cũ hơn số giờ này coi như mất kết nối thiết bị (docs/m3-spec.md – Phòng nuôi). */
const STALE_HOURS = 2;
/** Số thẻ tối đa trong một cột dây chuyền. */
const CARDS_PER_STAGE = 4;
/** Cửa sổ "sắp đến hạn" (ngày). */
const SOON = { transfer: 3, media: 7, nursery: 3, order: 30 };
/** Số tháng của biểu đồ tỷ lệ nhiễm. */
const TREND_MONTHS = 6;

const STAGE_HINT: Record<string, string> = {
  "Khởi đầu": "Vào mẫu, khử trùng, tái sinh chồi",
  "Nhân nhanh": "Cấy chuyển nhân chồi",
  "Ra rễ": "Tạo cây hoàn chỉnh",
  "Ra ngôi": "Chuẩn bị đưa ra vườn ươm",
};

const vnNum = (n: number) => n.toLocaleString("vi-VN");
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + (Number(f(x)) || 0), 0);

/** Nhãn hạn: quá hạn đỏ, trong cửa sổ vàng, còn lại xám. */
function dueLabel(days: number, soon: number, prefix = ""): PipelineItem["due"] {
  if (!Number.isFinite(days)) return undefined;
  if (days < 0) return { label: `${prefix}quá ${-days} ngày`, tone: "red" };
  if (days === 0) return { label: `${prefix}hôm nay`, tone: "amber" };
  if (days <= soon) return { label: `${prefix}còn ${days} ngày`, tone: "amber" };
  return { label: `${prefix}còn ${days} ngày`, tone: "muted" };
}

/** M3.1 – trang đầu phân hệ: dây chuyền in vitro, phòng nuôi, tỷ lệ nhiễm, việc cần làm. */
export default async function TissueOverviewPage() {
  const [batches, materials, cabinets, rooms, latest, mediaBatches, lots, sales, orders, threshold] = await Promise.all([
    cultureBatchStore.list().catch(() => []),
    tissueMaterialStore.list().catch(() => []),
    cabinetStore.list().catch(() => []),
    growthRoomStore.list().catch(() => []),
    latestReadings().catch(() => new Map<string, RoomReading>()),
    mediaBatchStore.list().catch(() => []),
    seedlingLotStore.list().catch(() => []),
    lotSaleStore.list().catch(() => []),
    seedlingOrderStore.list().catch(() => []),
    getSetting("tissue_contamination_threshold").catch(() => DEFAULT_CONTAMINATION_THRESHOLD),
  ]);
  const today = todayISO();
  const materialById = byId(materials);
  const cabinetById = byId(cabinets);
  const orderById = byId(orders);
  const batchById = byId(batches);
  const soldOf = (lotId: string) => sum(sales.filter((s) => s.lotId === lotId), (s) => s.quantity);

  /** Loài · giống của mẻ: truy ngược mẻ cha về vật liệu khởi đầu, nếu không có thì lấy theo đơn hàng. */
  const varietyOf = (b: CultureBatch | undefined) => {
    if (!b) return "";
    const root = lineage(b.id, batches).at(-1);
    const m = materialById.get(root?.materialId ?? b.materialId);
    if (m) return `${m.species} ${m.variety}`.trim();
    const o = orderById.get(b.orderId);
    return o ? `${o.species} ${o.variety}`.trim() : "";
  };

  // ---------- Dây chuyền ----------
  const growing = batches.filter((b) => b.status === "Đang nuôi");
  const stageNames = [
    ...CULTURE_STAGES.filter((s) => s !== "Ra ngôi" || growing.some((b) => b.stage === s)),
    ...[...new Set(growing.map((b) => b.stage).filter((s) => s && !(CULTURE_STAGES as readonly string[]).includes(s)))],
  ];
  const batchCard = (b: CultureBatch): PipelineItem => {
    const days = daysUntil(b.nextTransferAt);
    const age = -daysUntil(b.startedAt);
    const cycle = -daysUntil(b.startedAt) + days;
    return {
      id: b.id,
      href: `/culture-batches/${b.id}`,
      code: b.code,
      title: varietyOf(b),
      facts: [
        b.startedAt ? `cấy ${fmtDateVN(b.startedAt)}` : "",
        `${vnNum(b.vessels || 0)} bình`,
        cabinetById.get(b.cabinetId)?.code ?? "",
        b.subcultureNo ? `lần ${b.subcultureNo}` : "",
      ],
      due: dueLabel(days, SOON.transfer, "cấy chuyển "),
      fill: Number.isFinite(age) && Number.isFinite(cycle) && cycle > 0 ? (age / cycle) * 100 : undefined,
    };
  };
  const byDue = (a: CultureBatch, b: CultureBatch) => (a.nextTransferAt || "9999").localeCompare(b.nextTransferAt || "9999");

  const invitroStages: PipelineStage[] = stageNames.map((name) => {
    const list = growing.filter((b) => b.stage === name).sort(byDue);
    return {
      key: `stage-${name}`,
      name,
      hint: STAGE_HINT[name] ?? "Giai đoạn nuôi cấy",
      primary: { value: list.length, unit: "mẻ đang nuôi" },
      secondary: `${vnNum(sum(list, (b) => b.vessels))} bình · ${vnNum(sum(list, (b) => b.plantlets))} chồi/cây`,
      items: list.slice(0, CARDS_PER_STAGE).map(batchCard),
      total: list.length,
      moreHref: "/culture-batches",
      emptyText: "Không có mẻ đang nuôi",
      group: "invitro",
    };
  });

  const lotTitle = (batchId: string, orderId: string) => {
    const v = varietyOf(batchById.get(batchId));
    if (v) return v;
    const o = orderById.get(orderId);
    return o ? `${o.species} ${o.variety}`.trim() : "";
  };
  const nurseryLots = lots.filter((l) => l.status === "Vườn ươm").sort((a, b) => (a.readyAt || "9999").localeCompare(b.readyAt || "9999"));
  const readyLots = lots
    .filter((l) => l.status === "Đủ tiêu chuẩn xuất")
    .map((l) => ({ l, left: Math.max(0, (l.survived || 0) - soldOf(l.id)) }))
    .sort((a, b) => (a.l.readyAt || "").localeCompare(b.l.readyAt || ""));
  const from30 = new Date(Date.parse(today) - 30 * 86_400_000).toISOString().slice(0, 10);
  const recentSales = sales.filter((s) => s.soldAt && s.soldAt >= from30 && s.soldAt <= today).sort((a, b) => b.soldAt.localeCompare(a.soldAt));
  const lotById = byId(lots);

  const nurseryStages: PipelineStage[] = [
    {
      key: "nursery",
      name: "Vườn ươm",
      hint: "Ra ngôi, huấn luyện cây",
      primary: { value: sum(nurseryLots, (l) => l.survived || l.quantity), unit: "cây sống" },
      secondary: `${nurseryLots.length} lô · ${vnNum(sum(nurseryLots, (l) => l.quantity))} cây ra ngôi`,
      items: nurseryLots.slice(0, CARDS_PER_STAGE).map((l) => ({
        id: l.id,
        href: `/seedling-lots?q=${encodeURIComponent(l.code)}`,
        code: l.code,
        title: lotTitle(l.batchId, l.orderId),
        facts: [l.acclimatizedAt ? `ra ngôi ${fmtDateVN(l.acclimatizedAt)}` : "", `${vnNum(l.survived || 0)}/${vnNum(l.quantity || 0)} cây sống`, l.nurseryBed],
        due: dueLabel(daysUntil(l.readyAt), SOON.nursery, "đủ chuẩn "),
      })),
      total: nurseryLots.length,
      moreHref: "/seedling-lots",
      emptyText: "Không có lô trong vườn ươm",
      group: "nursery",
    },
    {
      key: "ready",
      name: "Đủ tiêu chuẩn xuất",
      hint: "Đã phân loại, chờ giao",
      primary: { value: sum(readyLots, (x) => x.left), unit: "cây còn lại" },
      secondary: `${readyLots.length} lô · Loại 1: ${vnNum(sum(readyLots, (x) => x.l.grade1Qty))} cây`,
      items: readyLots.slice(0, CARDS_PER_STAGE).map(({ l, left }) => ({
        id: l.id,
        href: `/seedling-lots?q=${encodeURIComponent(l.code)}`,
        code: l.code,
        title: lotTitle(l.batchId, l.orderId),
        facts: [`còn ${vnNum(left)} cây`, l.grade1Qty ? `L1 ${vnNum(l.grade1Qty)}` : "", l.grade2Qty ? `L2 ${vnNum(l.grade2Qty)}` : "", orderById.get(l.orderId)?.code ?? ""],
      })),
      total: readyLots.length,
      moreHref: "/seedling-lots",
      emptyText: "Chưa có lô đủ tiêu chuẩn",
      group: "nursery",
    },
    {
      key: "sold",
      name: "Xuất bán",
      hint: "30 ngày gần nhất",
      primary: { value: sum(recentSales, (s) => s.quantity), unit: "cây đã xuất" },
      secondary: `${recentSales.length} phiếu xuất`,
      items: recentSales.slice(0, CARDS_PER_STAGE).map((s) => ({
        id: s.id,
        href: `/lot-sales?q=${encodeURIComponent(s.code)}`,
        code: s.code,
        title: lotTitle(lotById.get(s.lotId)?.batchId ?? "", s.orderId || lotById.get(s.lotId)?.orderId || ""),
        facts: [fmtDateVN(s.soldAt), `${vnNum(s.quantity || 0)} cây`, s.grade, lotById.get(s.lotId)?.code ?? ""],
      })),
      total: recentSales.length,
      moreHref: "/lot-sales",
      emptyText: "Chưa xuất bán trong 30 ngày",
      group: "out",
    },
  ];

  // ---------- Phòng nuôi ----------
  const roomTiles: RoomTile[] = [...rooms]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((r) => {
      const last = latest.get(r.id);
      const alerts = last ? readingAlerts(r, last) : [];
      const outField = new Set(alerts.map((a) => a.field));
      const stale = Boolean(r.deviceCode) && isStaleReading(last?.at, STALE_HOURS);
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        deviceCode: r.deviceCode,
        state: stale ? "stale" : !last ? "none" : alerts.length ? "out" : "ok",
        lastAt: last?.at ?? "",
        source: last?.source ?? "",
        photoperiod: r.photoperiod,
        batches: growing.filter((b) => b.roomId === r.id).length,
        metrics: [
          { label: "Nhiệt độ", unit: "°C", value: last?.temperature ?? null, min: r.tempMin, max: r.tempMax, out: outField.has("Nhiệt độ") },
          { label: "Độ ẩm", unit: "%", value: last?.humidity ?? null, min: r.humidityMin, max: r.humidityMax, out: outField.has("Độ ẩm") },
          { label: "Ánh sáng", unit: "lux", value: last?.light ?? null, min: r.lightMin, max: r.lightMax, out: outField.has("Ánh sáng") },
        ],
      } satisfies RoomTile;
    });

  // ---------- Tỷ lệ nhiễm theo tháng ----------
  const [ty, tm] = today.split("-").map(Number);
  const monthKeys = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const d = new Date(Date.UTC(ty, tm - 1 - (TREND_MONTHS - 1 - i), 1));
    return { key: d.toISOString().slice(0, 7), label: `T${d.getUTCMonth() + 1}` };
  });
  const counted = batches.filter((b) => b.status !== "Hủy" && b.startedAt);
  const monthRates: MonthRate[] = monthKeys.map(({ key, label }) => {
    const inMonth = counted.filter((b) => b.startedAt.slice(0, 7) === key);
    const vessels = sum(inMonth, (b) => b.vessels);
    const contaminated = sum(inMonth, (b) => b.contaminated);
    return { key, label, vessels, contaminated, rate: pct(contaminated, vessels) };
  });
  const pool = (ms: MonthRate[]) => pct(sum(ms, (m) => m.contaminated), sum(ms, (m) => m.vessels));
  const half = Math.floor(TREND_MONTHS / 2);
  const recent = pool(monthRates.slice(half));
  const before = pool(monthRates.slice(0, half));
  const totalVessels = sum(monthRates, (m) => m.vessels);
  const totalContaminated = sum(monthRates, (m) => m.contaminated);

  // ---------- Việc cần làm ----------
  const todos: TodoItem[] = [];
  const whenText = (days: number) => (days < 0 ? `quá ${-days} ngày` : days === 0 ? "hôm nay" : `còn ${days} ngày`);
  const toneOf = (days: number): TodoItem["tone"] => (days < 0 ? "red" : "amber");
  for (const b of growing) {
    const d = daysUntil(b.nextTransferAt);
    if (Number.isFinite(d) && d <= SOON.transfer) {
      todos.push({ id: `t-${b.id}`, href: `/culture-batches/${b.id}`, kind: "transfer", code: b.code, text: `Cấy chuyển${b.stage ? ` ${b.stage.toLowerCase()}` : ""} · ${varietyOf(b) || "chưa rõ giống"} · ${vnNum(b.vessels || 0)} bình`, when: whenText(d), tone: toneOf(d), days: d });
    }
  }
  for (const m of mediaBatches) {
    const d = daysUntil(m.expiresAt);
    if (m.qcResult === "Chờ kiểm tra") {
      todos.push({ id: `mq-${m.id}`, href: `/media-batches?q=${encodeURIComponent(m.code)}`, kind: "media", code: m.code, text: `Lô môi trường chờ kiểm tra chất lượng${m.preparedAt ? ` (pha ${fmtDateVN(m.preparedAt)})` : ""}`, when: "chờ QC", tone: "amber", days: Number.isFinite(d) ? Math.min(d, 1) : 1 });
    } else if (m.qcResult === "Đạt" && Number.isFinite(d) && d >= 0 && d <= SOON.media) {
      todos.push({ id: `me-${m.id}`, href: `/media-batches?q=${encodeURIComponent(m.code)}`, kind: "media", code: m.code, text: `Lô môi trường sắp hết hạn dùng · ${vnNum(m.vessels || 0)} bình`, when: d === 0 ? "hết hạn hôm nay" : `hết hạn sau ${d} ngày`, tone: d <= 2 ? "red" : "amber", days: d });
    }
  }
  for (const l of nurseryLots) {
    const d = daysUntil(l.readyAt);
    if (Number.isFinite(d) && d <= SOON.nursery) {
      todos.push({ id: `n-${l.id}`, href: `/seedling-lots?q=${encodeURIComponent(l.code)}`, kind: "nursery", code: l.code, text: `Đến ngày đủ tiêu chuẩn – đánh giá, phân loại ${vnNum(l.survived || 0)} cây`, when: whenText(d), tone: toneOf(d), days: d });
    }
  }
  for (const { l, left } of readyLots) {
    if (left > 0) todos.push({ id: `r-${l.id}`, href: `/lot-sales`, kind: "nursery", code: l.code, text: `Sẵn sàng xuất ${vnNum(left)} cây${orderById.get(l.orderId) ? ` cho đơn ${orderById.get(l.orderId)!.code}` : ""}`, when: "chờ xuất", tone: "muted", days: SOON.nursery + 1 });
  }
  for (const o of orders) {
    if (o.status === "Hoàn thành" || o.status === "Hủy") continue;
    const d = daysUntil(o.dueAt);
    if (!Number.isFinite(d) || d > SOON.order) continue;
    const prog = orderProgress(o, sales.filter((s) => s.orderId === o.id));
    todos.push({
      id: `o-${o.id}`,
      href: `/seedling-orders/${o.id}`,
      kind: "order",
      code: o.code,
      text: `${`${o.species} ${o.variety}`.trim()} · đã giao ${vnNum(prog.delivered)}/${vnNum(o.quantity || 0)} cây (${prog.pct}%) · ${o.status}`,
      when: d < 0 ? `trễ ${-d} ngày` : d === 0 ? "giao hôm nay" : `giao sau ${d} ngày`,
      tone: d < 0 ? "red" : d <= 7 ? "amber" : "muted",
      days: d,
    });
  }
  todos.sort((a, b) => a.days - b.days);

  return (
    <>
      <Header title="Dây chuyền nuôi cấy" description="Toàn cảnh sản xuất cây giống in vitro: mẻ cấy theo giai đoạn, vườn ươm, xuất bán, điều kiện phòng nuôi và tỷ lệ nhiễm" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StagePipeline stages={[...invitroStages, ...nurseryStages]} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <TodoList items={todos} />
          <ContaminationTrend
            months={monthRates}
            overall={pct(totalContaminated, totalVessels)}
            vessels={totalVessels}
            contaminated={totalContaminated}
            delta={recent != null && before != null ? Math.round((recent - before) * 10) / 10 : null}
            threshold={threshold}
          />
        </div>
        <GrowthRoomTiles rooms={roomTiles} staleHours={STALE_HOURS} />
      </main>
    </>
  );
}
