import {
  MapPin,
  Camera,
  PenLine,
  WifiOff,
  CloudUpload,
  QrCode,
  Smartphone,
  Compass,
  Plus,
  ArrowRight,
  Thermometer,
  Droplets,
  Truck,
  Users as UsersIcon,
  Map as MapIcon,
  Cloud,
  CircleDot,
  CheckCircle2,
  Download,
  PackagePlus,
  ListChecks,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  samplingSessions,
  fieldSamples,
  type FieldSample,
  type FieldSampleStatus,
  type SamplingSessionStatus,
} from "@/lib/mock-data";

const sessionVariant: Record<
  SamplingSessionStatus,
  "secondary" | "default" | "warning" | "success"
> = {
  "Đang chuẩn bị": "secondary",
  "Đang triển khai": "warning",
  "Đã hoàn tất": "success",
  "Đã đóng": "default",
};

const fieldStatusMeta: Record<
  FieldSampleStatus,
  {
    variant: "secondary" | "default" | "warning" | "success" | "destructive";
    icon: typeof CircleDot;
    accent: string;
  }
> = {
  "Đang thu": {
    variant: "warning",
    icon: CircleDot,
    accent: "bg-amber-50 text-amber-600",
  },
  "Chờ đồng bộ": {
    variant: "destructive",
    icon: WifiOff,
    accent: "bg-rose-50 text-rose-600",
  },
  "Đã đồng bộ": {
    variant: "default",
    icon: CloudUpload,
    accent: "bg-blue-50 text-blue-600",
  },
  "Đã chuyển vào PTN": {
    variant: "success",
    icon: CheckCircle2,
    accent: "bg-emerald-50 text-emerald-700",
  },
};

const totalCollected = fieldSamples.length;
const pendingSync = fieldSamples.filter((s) => s.status === "Chờ đồng bộ").length;
const synced = fieldSamples.filter(
  (s) => s.status === "Đã đồng bộ" || s.status === "Đã chuyển vào PTN",
).length;
const activeSessions = samplingSessions.filter(
  (s) => s.status === "Đang triển khai",
).length;

const stats = [
  {
    label: "Đợt đang triển khai",
    value: activeSessions,
    icon: Truck,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Mẫu thu hiện trường",
    value: totalCollected,
    icon: PackagePlus,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Chờ đồng bộ",
    value: pendingSync,
    icon: WifiOff,
    accent: "bg-rose-50 text-rose-600",
  },
  {
    label: "Đã đồng bộ về Viện",
    value: synced,
    icon: CloudUpload,
    accent: "bg-violet-50 text-violet-600",
  },
];

function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const cx = 60 + ((lng - 105.4) * 100) % 60;
  const cy = 60 - ((lat - 19.9) * 100) % 50;
  return (
    <svg
      viewBox="0 0 160 120"
      className="w-full h-auto rounded-md border bg-emerald-50/60"
      role="img"
      aria-label={`Vị trí ${lat}, ${lng}`}
    >
      <defs>
        <pattern
          id="grid"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="#bbf7d0"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="160" height="120" fill="url(#grid)" />
      <path
        d="M 0 70 Q 40 60 80 75 T 160 65"
        stroke="#60a5fa"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <circle cx={cx} cy={cy} r="8" fill="#1d8048" opacity="0.18" />
      <circle cx={cx} cy={cy} r="4" fill="#1d8048" />
      <path
        d={`M ${cx} ${cy - 4} L ${cx + 3} ${cy - 11} L ${cx - 3} ${cy - 11} Z`}
        fill="#1d8048"
      />
    </svg>
  );
}

function SignaturePreview({ signed }: { signed: boolean }) {
  if (!signed) {
    return (
      <div className="h-12 w-full rounded border border-dashed flex items-center justify-center text-xs text-muted-foreground">
        Chưa có chữ ký KH
      </div>
    );
  }
  return (
    <svg
      viewBox="0 0 200 48"
      className="w-full h-12 rounded border bg-card"
      role="img"
      aria-label="Chữ ký khách hàng"
    >
      <path
        d="M 12 32 C 22 12, 38 36, 52 22 S 78 14, 96 30 S 128 8, 156 28 L 168 26"
        stroke="#1d8048"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 12 38 L 168 38"
        stroke="#cbd5e1"
        strokeWidth="0.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function FieldSampleCard({ sample }: { sample: FieldSample }) {
  const meta = fieldStatusMeta[sample.status];
  const session = samplingSessions.find(
    (s) => s.code === sample.sessionCode,
  );
  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold">
              {sample.fieldCode}
            </span>
            <Badge variant={meta.variant}>
              <meta.icon className="w-3 h-3" />
              {sample.status}
            </Badge>
          </div>
          <div className="text-sm font-medium mt-1">{sample.matrix}</div>
          {session && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              Đợt: {session.name}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${meta.accent}`}>
          <meta.icon className="w-5 h-5" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2 min-w-0">
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-mono text-[11px] text-muted-foreground">
                {sample.location.lat.toFixed(4)}° N · {sample.location.lng.toFixed(4)}° E
              </div>
              <div className="truncate">{sample.location.address}</div>
            </div>
          </div>
          <div className="text-xs grid grid-cols-2 gap-x-2 gap-y-1">
            <div>
              <div className="text-muted-foreground">Lượng mẫu</div>
              <div className="font-medium">{sample.amount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">KTV thu</div>
              <div className="font-medium">{sample.collectorName}</div>
            </div>
            {sample.depth && (
              <div>
                <div className="text-muted-foreground">Tầng đất</div>
                <div className="font-medium">{sample.depth}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground">Lúc</div>
              <div className="font-medium">{sample.collectedAt.slice(11)}</div>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-32 shrink-0">
          <MiniMap lat={sample.location.lat} lng={sample.location.lng} />
        </div>
      </div>

      {sample.onSiteReadings.length > 0 && (
        <div className="rounded-md bg-muted/50 p-2.5">
          <div className="text-[11px] font-semibold uppercase text-muted-foreground mb-1.5">
            Đo nhanh tại hiện trường
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {sample.onSiteReadings.map((r) => (
              <div key={r.name} className="bg-card rounded px-2 py-1 border">
                <div className="text-[10px] text-muted-foreground">{r.name}</div>
                <div className="font-semibold">
                  {r.value}
                  <span className="text-[10px] text-muted-foreground ml-0.5">
                    {r.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            {sample.photos} ảnh
          </span>
          <span className="flex items-center gap-1">
            <PenLine className="w-3.5 h-3.5" />
            {sample.hasSignature ? "Đã ký" : "Chưa ký"}
          </span>
        </div>
        {sample.linkedSampleCode && (
          <div className="text-muted-foreground">
            → <span className="font-mono">{sample.linkedSampleCode}</span>
          </div>
        )}
      </div>

      {sample.notes && (
        <div className="text-xs text-amber-700 bg-amber-50/60 px-2 py-1 rounded">
          {sample.notes}
        </div>
      )}
    </div>
  );
}

const activeSessionsList = samplingSessions.filter(
  (s) => s.status === "Đang triển khai",
);
const recentCompleted = samplingSessions.filter(
  (s) => s.status === "Đã hoàn tất",
);

const demoSample = fieldSamples[0];

export default function FieldPage() {
  return (
    <>
      <Header
        title="Lấy mẫu hiện trường"
        description="Phiếu lấy mẫu offline-first · GPS · ảnh · chữ ký khách hàng · đồng bộ về Viện khi có mạng"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="rounded-xl border bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">
              Cài đặt như ứng dụng trên điện thoại / tablet
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Trình duyệt → menu → "Thêm vào màn hình chính" (Android, iOS) hoặc "Cài
              đặt ứng dụng" (Chrome PC). Sau khi cài, mở app vẫn dùng được khi mất sóng.
            </div>
          </div>
          <Button variant="outline" className="shrink-0">
            <Download />
            Hướng dẫn cài
          </Button>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {s.label}
                  </div>
                  <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.accent}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
              <div>
                <CardTitle>Đợt lấy mẫu đang triển khai</CardTitle>
                <CardDescription>
                  Mỗi đợt do một nhóm phụ trách – tự sinh lịch & danh sách điểm lấy mẫu
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus />
                Tạo đợt mới
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {activeSessionsList.map((s) => {
                  const progress = Math.round(
                    (s.collectedSamples / s.plannedSamples) * 100,
                  );
                  const syncPct = Math.round(
                    (s.syncedSamples / s.plannedSamples) * 100,
                  );
                  return (
                    <li
                      key={s.id}
                      className="p-3 rounded-md border bg-card space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold">
                              {s.code}
                            </span>
                            <Badge variant={sessionVariant[s.status]}>
                              {s.status}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium mt-1">
                            {s.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1.5">
                            <MapIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{s.area}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-3.5 h-3.5" />
                          {s.leader} +{s.team.length - 1}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          {s.vehicle}
                        </span>
                        <span>·</span>
                        <span>Bắt đầu {s.startedAt}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">
                              Thu mẫu
                            </span>
                            <span className="font-medium">
                              {s.collectedSamples}/{s.plannedSamples}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">
                              Đồng bộ
                            </span>
                            <span className="font-medium">
                              {s.syncedSamples}/{s.plannedSamples}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${syncPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đợt đã hoàn tất gần đây</CardTitle>
              <CardDescription>Đã chuyển toàn bộ mẫu về PTN</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recentCompleted.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 p-3 rounded-md border bg-card"
                  >
                    <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-2">
                        {s.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {s.code} · {s.endedAt ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.collectedSamples} mẫu · {s.leader}
                      </div>
                    </div>
                  </li>
                ))}
                {recentCompleted.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    Chưa có đợt hoàn tất gần đây.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-semibold">Phiếu lấy mẫu gần đây</h2>
            <Button variant="outline" size="sm">
              <ListChecks />
              Xem tất cả
            </Button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {fieldSamples.map((s) => (
              <FieldSampleCard key={s.id} sample={s} />
            ))}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Demo phiếu lấy mẫu hiện trường</CardTitle>
            <CardDescription>
              Giao diện gọn cho điện thoại / tablet – tự nhập GPS, ảnh, chữ ký KH;
              dữ liệu cache offline đến khi có mạng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-card p-4 max-w-[420px] mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs">
                <Badge variant="warning">
                  <WifiOff className="w-3 h-3" />
                  Đang offline
                </Badge>
                <span className="text-muted-foreground">
                  Mã: {demoSample.fieldCode}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Mẫu
                </div>
                <div className="text-sm font-medium">{demoSample.matrix}</div>
                <div className="text-xs text-muted-foreground">
                  Đợt: {demoSample.sessionCode}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center justify-between">
                  <span>Vị trí lấy mẫu (GPS)</span>
                  <Compass className="w-3 h-3" />
                </div>
                <MiniMap
                  lat={demoSample.location.lat}
                  lng={demoSample.location.lng}
                />
                <div className="text-xs text-foreground/80">
                  <span className="font-mono">
                    {demoSample.location.lat.toFixed(4)}° N ·{" "}
                    {demoSample.location.lng.toFixed(4)}° E
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {demoSample.location.address}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Đo nhanh
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {demoSample.onSiteReadings.map((r) => {
                    const Icon = r.name.includes("Nhiệt") ? Thermometer : Droplets;
                    return (
                      <div
                        key={r.name}
                        className="rounded-md border p-2 flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-muted-foreground truncate">
                            {r.name}
                          </div>
                          <div className="text-sm font-semibold">
                            {r.value} {r.unit}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center justify-between">
                  <span>Ảnh hiện trường ({demoSample.photos})</span>
                  <Camera className="w-3 h-3" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-md bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700"
                    >
                      <Camera className="w-5 h-5 opacity-50" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground flex items-center justify-between">
                  <span>Chữ ký khách hàng</span>
                  <PenLine className="w-3 h-3" />
                </div>
                <SignaturePreview signed={demoSample.hasSignature} />
                <div className="text-xs text-muted-foreground">
                  HTX Nông nghiệp Đông Sơn · Ông Lê Văn Hợp
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Tem QR đính kèm
                </div>
                <div className="rounded-md border bg-muted/40 p-2 flex items-center gap-2">
                  <div className="w-12 h-12 rounded bg-card flex items-center justify-center text-foreground">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div className="text-xs">
                    <div className="font-medium">{demoSample.fieldCode}</div>
                    <div className="text-muted-foreground">
                      In qua máy in Bluetooth (Brother QL-820)
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <Button variant="outline" size="sm">
                  Lưu nháp
                </Button>
                <Button size="sm">
                  <CloudUpload />
                  Đồng bộ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quy trình lấy mẫu hiện trường</CardTitle>
            <CardDescription>
              5 bước phối hợp giữa cán bộ thực địa và phòng tiếp nhận mẫu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                {
                  icon: Truck,
                  title: "Tạo đợt + danh sách điểm",
                  desc: "Admin lập đợt, gán nhóm, sinh sẵn danh sách điểm theo bản đồ",
                },
                {
                  icon: MapPin,
                  title: "Đến hiện trường",
                  desc: "Mở app, chọn điểm, app tự bắt GPS và ghi giờ thực tế",
                },
                {
                  icon: Cloud,
                  title: "Thu mẫu offline",
                  desc: "Đo nhanh pH/EC, chụp ảnh, ghi chú, KH ký nhận – tất cả lưu trên máy",
                },
                {
                  icon: CloudUpload,
                  title: "Đồng bộ khi có mạng",
                  desc: "App tự đẩy dữ liệu + ảnh lên server khi 4G/Wi-Fi sẵn sàng",
                },
                {
                  icon: PackagePlus,
                  title: "Chuyển vào PTN",
                  desc: "Quét QR, tiếp nhận mẫu vào /samples, ghép với phiếu hiện trường",
                },
              ].map((step, i) => (
                <li
                  key={i}
                  className="relative p-3 rounded-md border bg-card flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Bước {i + 1}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {step.desc}
                  </div>
                  {i < 4 && (
                    <ArrowRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
