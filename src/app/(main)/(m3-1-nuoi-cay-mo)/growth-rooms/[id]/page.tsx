import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Cpu } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadingForm } from "@/components/m3/reading-form";
import { growthRoomStore, readingsOf, type RoomReading } from "@/lib/modules/m3/data/tissue";
import { readingAlerts } from "@/lib/modules/m3/tissue-rules";
import { currentAccess } from "@/lib/platform/data/access";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phòng nuôi" };

type Key = "temperature" | "humidity" | "light";

/** Biểu đồ đường SVG đơn giản cho 1 thông số, kèm dải ngưỡng. */
function Line({ data, k, min, max, unit }: { data: RoomReading[]; k: Key; min: number; max: number; unit: string }) {
  const pts = data.filter((d) => d[k] != null).map((d) => ({ t: new Date(d.at).getTime(), v: d[k] as number })).sort((a, b) => a.t - b.t);
  if (pts.length < 2) return <p className="text-xs text-muted-foreground">Chưa đủ số liệu để vẽ biểu đồ</p>;
  const W = 600, H = 140, P = 4;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
  const lo = Math.min(min, ...pts.map((p) => p.v)), hi = Math.max(max, ...pts.map((p) => p.v));
  const span = hi - lo || 1;
  const x = (t: number) => P + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - lo) / span) * (H - 2 * P);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" preserveAspectRatio="none" role="img" aria-label={`Biểu đồ ${unit}`}>
        <rect x={0} y={y(max)} width={W} height={Math.max(0, y(min) - y(max))} className="fill-emerald-500/10" />
        <path d={path} className="stroke-primary fill-none" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {pts.filter((p) => p.v < min || p.v > max).map((p) => <circle key={p.t} cx={x(p.t)} cy={y(p.v)} r={2.5} className="fill-rose-500" />)}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{fmtDateTimeVN(new Date(t0).toISOString())}</span><span>vùng xanh: ngưỡng {min}–{max} {unit}</span><span>{fmtDateTimeVN(new Date(t1).toISOString())}</span></div>
    </div>
  );
}

export default async function GrowthRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rooms, access] = await Promise.all([growthRoomStore.list(), currentAccess()]);
  const r = rooms.find((x) => x.id === id);
  if (!r) notFound();
  const data = await readingsOf(id, 72);
  const out = data.filter((d) => readingAlerts(r, d).length > 0);

  return (
    <>
      <Header title={`${r.code} · ${r.name}`} description={`Ngưỡng ${r.tempMin}–${r.tempMax} °C · ${r.humidityMin}–${r.humidityMax} % · ${r.lightMin}–${r.lightMax} lux${r.photoperiod ? ` · ${r.photoperiod}` : ""}`} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/growth-rooms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Tủ cấy & phòng nuôi
        </Link>
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle>Nhiệt độ (72 giờ)</CardTitle></CardHeader><CardContent><Line data={data} k="temperature" min={r.tempMin} max={r.tempMax} unit="°C" /></CardContent></Card>
          <Card><CardHeader><CardTitle>Độ ẩm (72 giờ)</CardTitle></CardHeader><CardContent><Line data={data} k="humidity" min={r.humidityMin} max={r.humidityMax} unit="%" /></CardContent></Card>
          <Card><CardHeader><CardTitle>Ánh sáng (72 giờ)</CardTitle></CardHeader><CardContent><Line data={data} k="light" min={r.lightMin} max={r.lightMax} unit="lux" /></CardContent></Card>
        </section>

        <Card>
          <CardHeader><CardTitle>Lần đo ngoài ngưỡng (72 giờ)</CardTitle><CardDescription>{data.length} lần đo · {out.length} lần ngoài ngưỡng</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm max-h-72 overflow-y-auto">
              {out.slice(0, 100).map((d) => (
                <li key={d.id} className="py-1.5 flex flex-wrap justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{fmtDateTimeVN(d.at)} · {d.source}</span>
                  <span className="text-xs text-rose-600">{readingAlerts(r, d).map((a) => `${a.field} ${a.value}`).join(" · ")}</span>
                </li>
              ))}
              {out.length === 0 && <li className="py-2 text-muted-foreground text-sm">Không có lần đo ngoài ngưỡng</li>}
            </ul>
          </CardContent>
        </Card>

        {access.can("write.tissue") && (
          <Card>
            <CardHeader><CardTitle>Nhập tay số liệu</CardTitle><CardDescription>Dùng khi thiết bị chưa kết nối hoặc để đối chiếu</CardDescription></CardHeader>
            <CardContent><ReadingForm roomId={r.id} /></CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="w-4 h-4" />Kết nối thiết bị đo (hạng mục I.1.4)</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Cấp khóa API phạm vi <span className="font-mono">m3:readings</span> ở trang <Link href="/integration" className="text-primary hover:underline">Tích hợp (M1)</Link>, khai báo mã thiết bị
              {r.deviceCode ? <> <span className="font-mono">{r.deviceCode}</span></> : " (chưa khai báo – sửa phòng nuôi)"} cho phòng này. Thiết bị gửi định kỳ:
            </p>
            <pre className="text-[11px] bg-muted/50 rounded p-3 overflow-x-auto">{`POST /api/v1/m3/room-readings
X-API-Key: vnn_…
Content-Type: application/json

{ "deviceCode": "${r.deviceCode || "MA-THIET-BI"}",
  "readings": [ { "at": "2026-10-21T08:00:00+07:00", "temperature": 25.1, "humidity": 62, "light": 3000 } ] }`}</pre>
            <p className="text-xs text-muted-foreground">Tối đa 500 lần đo mỗi lần gửi; giá trị ngoài khoảng vật lý hợp lý bị từ chối cả gói.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
