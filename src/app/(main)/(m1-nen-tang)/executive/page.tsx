import Link from "next/link";
import { Banknote, CalendarCheck, ClipboardList, OctagonAlert, Smile, Timer, Wrench, Beaker } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/common/stat-grid";
import { Bars } from "@/components/common/bar-chart";
import { dbQuery } from "@/lib/platform/db";
import { lastMonths } from "@/lib/platform/stats";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng điều hành" };

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
const REV = `status in ('KH chấp nhận', 'Đã ký HĐ', 'Đã nhận mẫu')`;

/** M1.5 Bảng thông tin điều hành – số liệu lấy từ kho dữ liệu (schema analytics). */
export default async function ExecutivePage() {
  const today = todayISO();
  const year = today.slice(0, 4);
  const months = lastMonths(today, 12);
  const [[k], monthly, byType, modules] = await Promise.all([
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
    dbQuery(
      `select m as month,
         (select count(*)::int from analytics.fact_samples where to_char(received_at, 'YYYY-MM') = m) samples,
         (select coalesce(sum(total), 0) from analytics.fact_revenue where ${REV} and month = m) revenue
       from unnest($1::text[]) m`,
      [months],
    ),
    dbQuery(`select coalesce(nullif(type, ''), 'Khác') type, count(*)::int n from analytics.fact_samples group by 1 order by 2 desc limit 8`),
    Promise.resolve([
      { code: "M1", name: "Nền tảng dùng chung", status: "Đang vận hành", href: "/system" },
      { code: "M2", name: "LIMS – phân tích, thí nghiệm", status: "Đang vận hành", href: "/lims" },
      { code: "M3.1", name: "Nuôi cấy mô & truy xuất nguồn gốc", status: "Kế hoạch", href: "" },
      { code: "M3.2", name: "Giống cây trồng, vật nuôi, thủy sản", status: "Kế hoạch", href: "" },
      { code: "M4", name: "Dịch vụ KH&CN, CRM, hợp đồng", status: "Kế hoạch", href: "" },
    ]),
  ]);
  const num = (v: unknown) => (v === null || v === undefined ? NaN : Number(v));
  const fmt = (v: unknown, suffix = "") => (Number.isNaN(num(v)) ? "—" : `${num(v)}${suffix}`);
  const maxType = Math.max(1, ...byType.map((t) => Number(t.n)));
  return (
    <>
      <Header title="Bảng thông tin điều hành" description="M1.5 – chỉ số tổng hợp toàn Viện từ kho dữ liệu dùng chung; cập nhật theo thời gian thực" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: `Mẫu năm ${year}`, value: Number(k.samples_year), icon: ClipboardList, accent: "bg-blue-50 text-blue-600", hint: `${k.samples_open} mẫu chưa trả kết quả` },
            { label: `Doanh thu ${year}`, value: vnd(Number(k.revenue_year)), icon: Banknote, accent: "bg-violet-50 text-violet-600", hint: "VNĐ, gồm VAT" },
            { label: "TAT trung vị", value: fmt(k.tat_median, " ngày"), icon: Timer, accent: "bg-amber-50 text-amber-600" },
            { label: "Trả đúng hạn", value: fmt(k.on_time_pct, "%"), icon: CalendarCheck, accent: "bg-emerald-50 text-emerald-700" },
          ]}
        />
        <StatGrid
          stats={[
            { label: "Không phù hợp đang mở", value: Number(k.nc_open), icon: OctagonAlert, accent: "bg-rose-50 text-rose-600" },
            { label: "Thiết bị đến hạn HC", value: Number(k.eq_due), icon: Wrench, accent: "bg-violet-50 text-violet-600", hint: "trong 30 ngày" },
            { label: "Cảnh báo hóa chất", value: Number(k.chem_alert), icon: Beaker, accent: "bg-amber-50 text-amber-600", hint: "tồn thấp / sắp hết hạn" },
            { label: "Đánh giá chất lượng khá–tốt", value: fmt(k.satisfaction, "%"), icon: Smile, accent: "bg-emerald-50 text-emerald-700", hint: `${k.complaints} khiếu nại` },
          ]}
        />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Mẫu tiếp nhận 12 tháng</CardTitle><CardDescription><Link href="/forecast" className="text-primary hover:underline">Xem dự báo →</Link></CardDescription></CardHeader>
            <CardContent><Bars months={months} values={monthly.map((m) => Number(m.samples))} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Doanh thu 12 tháng (VNĐ)</CardTitle><CardDescription>Phiếu yêu cầu được chấp nhận</CardDescription></CardHeader>
            <CardContent><Bars months={months} values={monthly.map((m) => Number(m.revenue))} fmt={(n) => `${vnd(n / 1e6)}tr`} /></CardContent>
          </Card>
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Cơ cấu mẫu theo loại</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byType.length === 0 && <div className="text-sm text-muted-foreground">Chưa có mẫu</div>}
              {byType.map((t) => (
                <div key={t.type as string} className="flex items-center gap-3 text-sm">
                  <span className="w-48 truncate">{t.type as string}</span>
                  <div className="flex-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${(Number(t.n) / maxType) * 100}%` }} /></div>
                  <span className="w-8 text-right font-medium">{t.n as number}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Tình trạng các phân hệ</CardTitle><CardDescription>Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {modules.map((m) => (
                  <li key={m.code} className="py-2 flex items-center gap-3">
                    <span className="font-mono text-xs w-10">{m.code}</span>
                    {m.href ? <Link href={m.href} className="flex-1 hover:underline">{m.name}</Link> : <span className="flex-1">{m.name}</span>}
                    <Badge variant={m.status === "Đang vận hành" ? "success" : "secondary"}>{m.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
