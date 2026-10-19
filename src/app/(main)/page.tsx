import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  FlaskConical,
  Wrench,
  Beaker,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { samples, dashboardKpis, equipments, chemicals } from "@/lib/mock-data";

const statusVariant = {
  "Đã tiếp nhận": "secondary",
  "Đang phân tích": "default",
  "Chờ duyệt": "warning",
  "Hoàn thành": "success",
  "Đã trả KQ": "outline",
} as const;

export default function DashboardPage() {
  const recent = samples.slice(0, 5);
  const upcomingCalibration = equipments
    .filter((e) => e.status !== "Ngừng")
    .sort(
      (a, b) =>
        new Date(a.nextCalibration).getTime() -
        new Date(b.nextCalibration).getTime(),
    )
    .slice(0, 4);
  const lowStock = chemicals.filter((c) => c.stock < c.minStock);

  return (
    <>
      <Header
        title="Bảng điều khiển – Viện Nông nghiệp tỉnh Thanh Hóa"
        description="Số hóa quy trình nhận mẫu · phân tích · thiết bị · hóa chất theo ISO/IEC 17025"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="rounded-xl border bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="w-16 h-16 rounded-full bg-white ring-1 ring-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src="/logo-vnnth.png"
              alt="Viện Nông nghiệp tỉnh Thanh Hóa"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">
              Phòng phân tích Đất, nước, phân bón và môi trường – Viện Nông nghiệp tỉnh Thanh Hóa
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Đáp ứng phân tích đất – nước – phân bón – an toàn thực phẩm, giảm
              sai sót thủ công, tăng tốc xử lý mẫu và hỗ trợ tự chủ tài chính.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">ISO/IEC 17025:2017</Badge>
            <Badge variant="outline">VILAS 1501</Badge>
          </div>
        </section>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Mẫu trong tháng"
            value={dashboardKpis.sampleTotal}
            hint="+12% so với tháng trước"
            icon={<ClipboardList className="w-5 h-5" />}
            accent="bg-blue-50 text-blue-600"
          />
          <KpiCard
            label="Đang phân tích"
            value={dashboardKpis.sampleInProgress}
            hint={`${dashboardKpis.sampleOverdue} mẫu sắp đến hạn`}
            icon={<FlaskConical className="w-5 h-5" />}
            accent="bg-amber-50 text-amber-600"
          />
          <KpiCard
            label="Thiết bị cần hiệu chuẩn"
            value={dashboardKpis.equipmentCalibrationDue}
            hint="trong 60 ngày tới"
            icon={<Wrench className="w-5 h-5" />}
            accent="bg-violet-50 text-violet-600"
          />
          <KpiCard
            label="Hóa chất tồn thấp"
            value={dashboardKpis.chemicalLowStock}
            hint={`${dashboardKpis.chemicalExpiringSoon} sắp hết hạn`}
            icon={<Beaker className="w-5 h-5" />}
            accent="bg-rose-50 text-rose-600"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Mẫu gần đây</CardTitle>
                <CardDescription>
                  Theo dõi tiến độ phân tích các mẫu mới tiếp nhận
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/samples">Xem tất cả</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recent.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {s.code.split("-").pop()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{s.code}</span>
                        <Badge variant={statusVariant[s.status]}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.customer} · {s.type}
                      </div>
                    </div>
                    <div className="hidden md:block w-40">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                        <span>Tiến độ</span>
                        <span>{s.progress}%</span>
                      </div>
                      <Progress value={s.progress} />
                    </div>
                    <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground w-32">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Hạn {s.dueAt}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cảnh báo & Nhắc việc</CardTitle>
              <CardDescription>Hiệu chuẩn, hết hạn, tồn kho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Hiệu chuẩn sắp đến
                </div>
                <ul className="space-y-2">
                  {upcomingCalibration.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Wrench className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{e.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.nextCalibration}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Hóa chất tồn thấp
                </div>
                <ul className="space-y-2">
                  {lowStock.length === 0 && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      Không có hóa chất tồn thấp
                    </li>
                  )}
                  {lowStock.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                      <span className="truncate flex-1">{c.name}</span>
                      <span className="text-xs font-medium text-destructive">
                        {c.stock} {c.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Hiệu suất phòng thí nghiệm</CardTitle>
              <CardDescription>
                Tỷ lệ hoàn thành đúng hạn theo nhóm chỉ tiêu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Đất & phân bón", value: 94 },
                { name: "Nước tưới & môi trường", value: 90 },
                { name: "Dư lượng BVTV & nông sản", value: 81 },
                { name: "Vi sinh đất – Sinh học", value: 88 },
              ].map((g) => (
                <div key={g.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{g.name}</span>
                    <span className="font-medium">{g.value}%</span>
                  </div>
                  <Progress value={g.value} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Truy xuất nhanh</CardTitle>
              <CardDescription>
                Mở các tác vụ thường dùng trong phòng thí nghiệm
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <QuickLink
                href="/samples"
                icon={<ClipboardList className="w-5 h-5" />}
                title="Tiếp nhận mẫu"
                desc="Tạo phiếu, in mã"
              />
              <QuickLink
                href="/analysis"
                icon={<FlaskConical className="w-5 h-5" />}
                title="Nhập kết quả"
                desc="QA/QC phê duyệt"
              />
              <QuickLink
                href="/equipment"
                icon={<Wrench className="w-5 h-5" />}
                title="Thiết bị"
                desc="Lịch hiệu chuẩn"
              />
              <QuickLink
                href="/chemicals"
                icon={<Beaker className="w-5 h-5" />}
                title="Hóa chất"
                desc="Nhập – xuất kho"
              />
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {label}
            </div>
            <div className="text-3xl font-semibold mt-1.5">{value}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {hint}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
    >
      <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}
