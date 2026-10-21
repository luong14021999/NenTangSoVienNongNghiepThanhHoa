import Link from "next/link";
import { Wind, Thermometer, AlertTriangle, Cpu } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import { cabinetStore, cultureBatchStore, growthRoomStore, latestReadings } from "@/lib/modules/m3/data/tissue";
import { CABINET_STATUSES, isStaleReading, readingAlerts } from "@/lib/modules/m3/tissue-rules";
import { contaminationRate, fmtPct } from "@/lib/modules/m3/rates";
import { getSetting } from "@/lib/platform/data/settings";
import { daysUntil, fmtDateTimeVN, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tủ cấy & phòng nuôi" };

const CABINET_FIELDS: CrudField[] = [
  { name: "code", label: "Mã tủ cấy", required: true, mono: true, placeholder: "VD: TC-01" },
  { name: "name", label: "Tên / model", required: true },
  { name: "room", label: "Phòng đặt tủ" },
  { name: "status", label: "Tình trạng", type: "select", options: [...CABINET_STATUSES] },
  { name: "lastMaintainedAt", label: "Bảo trì gần nhất", type: "date" },
  { name: "lastFilterCheckAt", label: "Kiểm tra màng lọc HEPA gần nhất", type: "date" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const ROOM_FIELDS: CrudField[] = [
  { name: "code", label: "Mã phòng nuôi", required: true, mono: true, placeholder: "VD: PN-01" },
  { name: "name", label: "Tên phòng", required: true },
  { name: "deviceCode", label: "Mã thiết bị đo (hạng mục I.1.4)", mono: true, full: true },
  { name: "tempMin", label: "Nhiệt độ tối thiểu (°C)", type: "number", defaultValue: 23 },
  { name: "tempMax", label: "Nhiệt độ tối đa (°C)", type: "number", defaultValue: 27 },
  { name: "humidityMin", label: "Độ ẩm tối thiểu (%)", type: "number", defaultValue: 50 },
  { name: "humidityMax", label: "Độ ẩm tối đa (%)", type: "number", defaultValue: 75 },
  { name: "lightMin", label: "Ánh sáng tối thiểu (lux)", type: "number", defaultValue: 2000 },
  { name: "lightMax", label: "Ánh sáng tối đa (lux)", type: "number", defaultValue: 4000 },
  { name: "photoperiod", label: "Quang chu kỳ", full: true },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

/** Số liệu đo cũ hơn số giờ này coi như mất kết nối thiết bị. */
const STALE_HOURS = 2;

export default async function GrowthRoomsPage() {
  const [cabinets, rooms, latest, batches, threshold] = await Promise.all([
    cabinetStore.list(),
    growthRoomStore.list(),
    latestReadings(),
    cultureBatchStore.list(),
    getSetting("tissue_contamination_threshold").catch(() => 7),
  ]);
  const roomAlerts = rooms.map((r) => {
    const last = latest.get(r.id);
    const stale = isStaleReading(last?.at, STALE_HOURS);
    return { room: r, last, stale, alerts: last ? readingAlerts(r, last) : [] };
  });
  const rateOf = (cabinetId: string) => {
    const used = batches.filter((b) => b.cabinetId === cabinetId);
    return { n: used.length, rate: contaminationRate({ vessels: used.reduce((s, b) => s + b.vessels, 0), contaminated: used.reduce((s, b) => s + b.contaminated, 0) }) };
  };

  return (
    <>
      <Header title="Tủ cấy & phòng nuôi" description="Tủ cấy vô trùng, phòng nuôi và ngưỡng nhiệt độ – độ ẩm – ánh sáng; số liệu từ thiết bị đo tại hạng mục I.1.4" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tủ cấy đang dùng", value: cabinets.filter((c) => c.status === "Đang dùng").length, icon: Wind, accent: "bg-blue-50 text-blue-600" },
            { label: "Phòng nuôi", value: rooms.length, icon: Thermometer, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Phòng ngoài ngưỡng", value: roomAlerts.filter((x) => x.alerts.length).length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "theo lần đo mới nhất" },
            { label: "Thiết bị mất tín hiệu", value: roomAlerts.filter((x) => x.room.deviceCode && x.stale).length, icon: Cpu, accent: "bg-amber-50 text-amber-600", hint: `không có số liệu > ${STALE_HOURS} giờ` },
          ]}
        />
        <CrudTableCard
          title="Phòng nuôi"
          description="Bấm mã phòng để xem biểu đồ 72 giờ, nhập tay số liệu và hướng dẫn kết nối thiết bị"
          endpoint="/api/growth-rooms"
          entity="growth-rooms"
          editFields={ROOM_FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/growth-rooms" title="Thêm phòng nuôi" fields={ROOM_FIELDS} addLabel="Thêm phòng" />}
          headers={["Mã / tên", "Ngưỡng", "Lần đo mới nhất", "Cảnh báo"]}
          emptyText="Chưa có phòng nuôi"
          rows={roomAlerts.map(({ room: r, last, stale, alerts }) => ({
            id: r.id,
            label: r.code,
            initial: r,
            cells: [
              <div key="c"><Link href={`/growth-rooms/${r.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{r.code}</Link><div className="text-[11px] text-muted-foreground">{r.name}{r.deviceCode && ` · thiết bị ${r.deviceCode}`}</div></div>,
              <div key="l" className="text-[11px] text-muted-foreground whitespace-nowrap">{r.tempMin}–{r.tempMax} °C · {r.humidityMin}–{r.humidityMax} %<div>{r.lightMin}–{r.lightMax} lux{r.photoperiod && ` · ${r.photoperiod}`}</div></div>,
              last ? (
                <div key="v" className="text-xs whitespace-nowrap">
                  {[last.temperature != null && `${last.temperature} °C`, last.humidity != null && `${last.humidity} %`, last.light != null && `${last.light} lux`].filter(Boolean).join(" · ")}
                  <div className={stale ? "text-amber-600" : "text-muted-foreground"}>{fmtDateTimeVN(last.at)} · {last.source}</div>
                </div>
              ) : <span key="v" className="text-xs text-muted-foreground">Chưa có số liệu</span>,
              <div key="a" className="text-xs">
                {alerts.map((a) => <div key={a.field} className="text-rose-600 font-medium">{a.field} {a.value} (ngưỡng {a.limit})</div>)}
                {!alerts.length && last && <Badge variant="success">Trong ngưỡng</Badge>}
              </div>,
            ],
          }))}
        />
        <CrudTableCard
          title="Tủ cấy vô trùng"
          description={`Tỷ lệ nhiễm của các mẻ cấy trên từng tủ; vượt ${threshold}% được tô đỏ – kiểm tra màng lọc, thao tác vô trùng`}
          endpoint="/api/cabinets"
          entity="cabinets"
          editFields={CABINET_FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/cabinets" title="Thêm tủ cấy" fields={CABINET_FIELDS} addLabel="Thêm tủ cấy" />}
          headers={["Mã / tên", "Phòng", "Bảo trì · màng lọc", "Mẻ cấy · tỷ lệ nhiễm", "Tình trạng"]}
          emptyText="Chưa có tủ cấy"
          rows={cabinets.sort((a, b) => a.code.localeCompare(b.code)).map((c) => {
            const { n, rate } = rateOf(c.id);
            const filterDays = daysUntil(c.lastFilterCheckAt);
            return {
              id: c.id,
              label: c.code,
              initial: c,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{c.code}</div><div className="text-[11px] text-muted-foreground">{c.name}</div></div>,
                <span key="r" className="text-xs">{c.room || "—"}</span>,
                <div key="m" className="text-xs">{fmtDateVN(c.lastMaintainedAt) || "—"}<div className={Number.isFinite(filterDays) && filterDays < -180 ? "text-amber-600" : "text-muted-foreground"}>HEPA {fmtDateVN(c.lastFilterCheckAt) || "chưa ghi"}</div></div>,
                <span key="n" className={`text-xs ${rate != null && rate > threshold ? "text-rose-600 font-medium" : ""}`}>{n} mẻ · {fmtPct(rate)}</span>,
                <Badge key="s" variant={c.status === "Đang dùng" ? "success" : "secondary"}>{c.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
