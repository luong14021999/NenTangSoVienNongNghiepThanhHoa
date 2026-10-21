import {
  Telescope,
  Map as MapIcon,
  ListChecks,
  AlertTriangle,
  FileSignature,
  Plus,
  Filter,
  Search,
  TrendingUp,
  CalendarRange,
  Users as UsersIcon,
  FileText,
  Download,
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
import { campaigns, type CampaignStatus, type Campaign } from "@/lib/mock-data";

const statusVariant: Record<
  CampaignStatus,
  "secondary" | "default" | "warning" | "success" | "outline"
> = {
  "Lập kế hoạch": "secondary",
  "Đang triển khai": "warning",
  "Đang phân tích": "default",
  "Đã có báo cáo": "success",
  "Đã đóng": "outline",
};

const totals = campaigns.reduce(
  (acc, c) => {
    acc.points += c.plannedPoints;
    acc.collected += c.collectedSamples;
    acc.analyzed += c.analyzedSamples;
    acc.exceed += c.exceedanceCount ?? 0;
    return acc;
  },
  { points: 0, collected: 0, analyzed: 0, exceed: 0 },
);

const stats = [
  {
    label: "Tổng đợt năm nay",
    value: campaigns.length,
    icon: Telescope,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Đang triển khai / Phân tích",
    value: campaigns.filter(
      (c) => c.status === "Đang triển khai" || c.status === "Đang phân tích",
    ).length,
    icon: ListChecks,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Tổng điểm quan trắc",
    value: totals.points,
    icon: MapIcon,
    accent: "bg-violet-50 text-violet-600",
  },
  {
    label: "Điểm vượt ngưỡng QCVN",
    value: totals.exceed,
    icon: AlertTriangle,
    accent: "bg-rose-50 text-rose-600",
  },
];

const featured = campaigns.find((c) => c.status === "Đã có báo cáo")!;

function CampaignMap({ points }: { points: NonNullable<Campaign["points"]> }) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const latMin = Math.min(...lats) - 0.005;
  const latMax = Math.max(...lats) + 0.005;
  const lngMin = Math.min(...lngs) - 0.005;
  const lngMax = Math.max(...lngs) + 0.005;

  const W = 720;
  const H = 280;
  const PAD = 28;
  const xScale = (lng: number) =>
    PAD + ((lng - lngMin) / (lngMax - lngMin)) * (W - 2 * PAD);
  const yScale = (lat: number) =>
    PAD + ((latMax - lat) / (latMax - latMin)) * (H - 2 * PAD);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      <defs>
        <pattern
          id="cmpgrid"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#dcfce7"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#cmpgrid)" />
      <path
        d={`M 0 ${H * 0.65} Q ${W * 0.25} ${H * 0.55} ${W * 0.5} ${H * 0.7} T ${W} ${H * 0.6}`}
        stroke="#60a5fa"
        strokeWidth="3"
        fill="none"
        opacity="0.45"
      />
      <text x={W - 50} y={H * 0.62} fontSize="10" fill="#3b82f6">
        kênh
      </text>

      {points.map((p) => {
        const x = xScale(p.lng);
        const y = yScale(p.lat);
        const violated = p.values.filter((v) => v.value > v.limit).length;
        const warning = p.values.filter(
          (v) => v.value > v.limit * 0.85 && v.value <= v.limit,
        ).length;
        const color =
          violated > 0 ? "#dc2626" : warning > 0 ? "#f59e0b" : "#16a34a";
        const r = violated > 0 ? 9 : 6;
        return (
          <g key={p.id}>
            <circle
              cx={x}
              cy={y}
              r={r + 4}
              fill={color}
              opacity="0.15"
            />
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={color}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={x}
              y={y - r - 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#0f172a"
            >
              {p.code}
            </text>
          </g>
        );
      })}

      <g transform={`translate(${W - 160}, ${H - 60})`}>
        <rect
          x="0"
          y="0"
          width="150"
          height="50"
          rx="6"
          fill="white"
          fillOpacity="0.92"
          stroke="#e2e8f0"
        />
        <circle cx="12" cy="14" r="4" fill="#16a34a" />
        <text x="22" y="17" fontSize="9" fill="#0f172a">
          Đạt QCVN
        </text>
        <circle cx="12" cy="28" r="4" fill="#f59e0b" />
        <text x="22" y="31" fontSize="9" fill="#0f172a">
          Gần ngưỡng (≥ 85%)
        </text>
        <circle cx="12" cy="42" r="4" fill="#dc2626" />
        <text x="22" y="45" fontSize="9" fill="#0f172a">
          Vượt ngưỡng
        </text>
      </g>
    </svg>
  );
}

function TrendChart({
  series,
  unit,
}: {
  series: { period: string; value: number }[];
  unit: string;
}) {
  const W = 360;
  const H = 140;
  const PAD = { top: 12, right: 16, bottom: 26, left: 36 };
  const PLOT_W = W - PAD.left - PAD.right;
  const PLOT_H = H - PAD.top - PAD.bottom;
  const vals = series.map((s) => s.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const yMin = min - range * 0.2;
  const yMax = max + range * 0.2;
  const xScale = (i: number) =>
    PAD.left + (i / Math.max(series.length - 1, 1)) * PLOT_W;
  const yScale = (v: number) =>
    PAD.top + ((yMax - v) / (yMax - yMin)) * PLOT_H;
  const polyline = series.map((s, i) => `${xScale(i)},${yScale(s.value)}`).join(" ");
  const last = series[series.length - 1];
  const first = series[0];
  const trendUp = last.value > first.value;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      <line
        x1={PAD.left}
        x2={PAD.left + PLOT_W}
        y1={PAD.top + PLOT_H}
        y2={PAD.top + PLOT_H}
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <polyline
        points={polyline}
        fill="none"
        stroke={trendUp ? "#dc2626" : "#16a34a"}
        strokeWidth="2"
      />
      {series.map((s, i) => (
        <g key={i}>
          <circle
            cx={xScale(i)}
            cy={yScale(s.value)}
            r="3.5"
            fill={trendUp ? "#dc2626" : "#16a34a"}
          />
          <text
            x={xScale(i)}
            y={PAD.top + PLOT_H + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#64748b"
          >
            {s.period}
          </text>
          <text
            x={xScale(i)}
            y={yScale(s.value) - 6}
            textAnchor="middle"
            fontSize="9"
            fill="#0f172a"
            fontWeight="600"
          >
            {s.value}
          </text>
        </g>
      ))}
      <text
        x={PAD.left - 4}
        y={PAD.top + 8}
        textAnchor="end"
        fontSize="9"
        fill="#94a3b8"
      >
        {yMax.toFixed(unit === "CFU/100mL" ? 0 : 3)}
      </text>
      <text
        x={PAD.left - 4}
        y={PAD.top + PLOT_H}
        textAnchor="end"
        fontSize="9"
        fill="#94a3b8"
      >
        {yMin.toFixed(unit === "CFU/100mL" ? 0 : 3)}
      </text>
    </svg>
  );
}

export default function CampaignsPage() {
  return (
    <>
      <Header
        title="Quan trắc môi trường theo đợt"
        description="Lập kế hoạch → Lấy mẫu → Phân tích → Báo cáo đợt + So sánh xu hướng giữa các đợt"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
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

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh mục đợt quan trắc</CardTitle>
              <CardDescription>
                Mỗi đợt là một chương trình quan trắc/giám sát có kế hoạch, KH
                đặt hàng và báo cáo tổng hợp
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 h-9 text-sm w-full sm:w-56">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  className="bg-transparent outline-none flex-1"
                  placeholder="Tìm mã đợt, khu vực..."
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <Button size="sm">
                <Plus />
                Tạo đợt mới
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {campaigns.map((c) => {
                const progressCollect = Math.round(
                  (c.collectedSamples / c.plannedPoints) * 100,
                );
                const progressAnalyze = Math.round(
                  (c.analyzedSamples / c.plannedPoints) * 100,
                );
                return (
                  <li
                    key={c.id}
                    className="p-4 rounded-lg border bg-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold">
                            {c.code}
                          </span>
                          <Badge variant={statusVariant[c.status]}>
                            {c.status}
                          </Badge>
                          {c.exceedanceCount && c.exceedanceCount > 0 && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3" />
                              {c.exceedanceCount} điểm vượt
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                          <MapIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{c.area}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs grid grid-cols-2 gap-x-3 gap-y-1">
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <UsersIcon className="w-3 h-3" />
                          KH
                        </div>
                        <div className="font-medium truncate">{c.client}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <CalendarRange className="w-3 h-3" />
                          Thời gian
                        </div>
                        <div className="font-medium">
                          {c.startDate} → {c.endDate}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Mục đích</div>
                        <div className="line-clamp-2">{c.purpose}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.criteria.slice(0, 6).map((cr) => (
                        <Badge key={cr} variant="secondary" className="text-[10px]">
                          {cr}
                        </Badge>
                      ))}
                      {c.criteria.length > 6 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{c.criteria.length - 6}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">
                            Thu mẫu
                          </span>
                          <span className="font-medium">
                            {c.collectedSamples}/{c.plannedPoints}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${progressCollect}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">
                            Đã phân tích
                          </span>
                          <span className="font-medium">
                            {c.analyzedSamples}/{c.plannedPoints}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${progressAnalyze}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {c.reportCode && (
                      <div className="flex items-center justify-between text-xs pt-2 border-t">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {c.reportCode} · {c.reportPublishedAt}
                        </span>
                        <Button variant="ghost" size="sm" className="h-7">
                          <Download className="w-3.5 h-3.5" />
                          Tải BC
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {featured.points && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Báo cáo đợt: {featured.name}</CardTitle>
                  <CardDescription>
                    {featured.code} · phát hành {featured.reportPublishedAt} ·{" "}
                    {featured.client}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileSignature />
                    Ký số
                  </Button>
                  <Button size="sm">
                    <Download />
                    Tải PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">
                  Bản đồ phân bố điểm quan trắc
                </div>
                <div className="rounded-lg border bg-emerald-50/40 p-2">
                  <CampaignMap points={featured.points} />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">
                  Matrix điểm × chỉ tiêu
                </div>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-xs min-w-[560px]">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-2">Điểm</th>
                        <th className="text-left p-2">Vị trí</th>
                        {featured.points[0].values.map((v) => (
                          <th key={v.criterion} className="text-right p-2">
                            {v.criterion}
                            <div className="text-[10px] text-muted-foreground font-normal">
                              ≤ {v.limit} {v.unit}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {featured.points.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2 font-mono font-semibold">
                            {p.code}
                          </td>
                          <td className="p-2 text-muted-foreground max-w-[200px]">
                            {p.name}
                          </td>
                          {p.values.map((v) => {
                            const exceed = v.value > v.limit;
                            const near =
                              !exceed && v.value > v.limit * 0.85;
                            return (
                              <td
                                key={v.criterion}
                                className={`p-2 text-right font-medium ${
                                  exceed
                                    ? "text-rose-600 bg-rose-50"
                                    : near
                                      ? "text-amber-700 bg-amber-50"
                                      : "text-emerald-700"
                                }`}
                              >
                                {v.value}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Ô nền hồng = vượt ngưỡng QCVN · Ô vàng = gần ngưỡng (≥ 85%)
                </div>
              </div>

              {featured.trend && featured.trend.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Xu hướng qua 4 đợt liên tiếp
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featured.trend.map((t) => (
                      <div
                        key={t.criterion}
                        className="rounded-lg border bg-card p-3"
                      >
                        <div className="text-sm font-medium mb-1">
                          {t.criterion}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({t.unit})
                          </span>
                        </div>
                        <TrendChart series={t.series} unit={t.unit} />
                        <div className="text-xs text-muted-foreground mt-1">
                          Tăng từ {t.series[0].value} → {t.series.at(-1)?.value}{" "}
                          {t.unit} qua 4 quý · cảnh báo xu hướng tăng
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">
                  Cấu trúc báo cáo đợt
                </div>
                <ol className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {[
                    "1. Tóm tắt thực hiện",
                    "2. Phương pháp lấy mẫu & PT",
                    "3. Kết quả phân tích",
                    "4. Đối chiếu QCVN",
                    "5. Đánh giá xu hướng",
                    "6. Khuyến nghị",
                  ].map((s) => (
                    <li
                      key={s}
                      className="px-3 py-2 rounded-md border bg-card"
                    >
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
