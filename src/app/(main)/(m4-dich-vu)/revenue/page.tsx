import Link from "next/link";
import { Download, FileSignature, Wallet, TrendingUp, Percent } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/common/stat-grid";
import { Bars } from "@/components/common/bar-chart";
import { revenueReport } from "@/lib/modules/m4/data/revenue";
import { fmtVND, marginPct } from "@/lib/modules/m4/finance";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Báo cáo doanh thu" };

const short = (n: number) => (n >= 1e9 ? `${(n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ` : `${Math.round(n / 1e6).toLocaleString("vi-VN")}tr`);

export default async function RevenuePage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const thisYear = Number(todayISO().slice(0, 4));
  const y = Number((await searchParams).year) || thisYear;
  const year = Math.min(thisYear + 1, Math.max(2020, y));
  const r = await revenueReport(year);
  const margin = marginPct(r.totals.revenueExVat, r.totals.cost);

  return (
    <>
      <Header title="Báo cáo doanh thu" description="Phục vụ phương án tự chủ tài chính: giá trị ký kết, số đã thu, cơ cấu theo dịch vụ và khách hàng, so với giá thành định mức" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {[thisYear - 2, thisYear - 1, thisYear].map((yy) => (
            <Link key={yy} href={`/revenue?year=${yy}`} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${yy === year ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
              Năm {yy}
            </Link>
          ))}
          <a href={`/api/m4-reports/revenue?year=${year}`} className="ml-auto h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent">
            <Download className="w-4 h-4" /> Xuất CSV
          </a>
        </div>
        <StatGrid
          stats={[
            { label: `Giá trị ký kết ${year}`, value: fmtVND(r.totals.contracted), icon: FileSignature, accent: "bg-blue-50 text-blue-600", hint: "hợp đồng theo ngày ký, sau thuế" },
            { label: `Đã thu ${year}`, value: fmtVND(r.totals.collected), icon: Wallet, accent: "bg-emerald-50 text-emerald-700", hint: "theo ngày thu" },
            { label: "Doanh thu dịch vụ (chưa thuế)", value: fmtVND(r.totals.revenueExVat), icon: TrendingUp, accent: "bg-violet-50 text-violet-600", hint: "báo giá được chấp nhận" },
            { label: "Tỷ suất lợi nhuận", value: margin == null ? "—" : `${margin.toLocaleString("vi-VN")}%`, icon: Percent, accent: "bg-amber-50 text-amber-600", hint: r.totals.cost ? `giá thành ${fmtVND(r.totals.cost)}` : "cần nhập định mức ở Bảng giá" },
          ]}
        />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Giá trị ký kết theo tháng</CardTitle></CardHeader>
            <CardContent><Bars months={r.byMonth.months} values={r.byMonth.contracted} fmt={short} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Số đã thu theo tháng</CardTitle></CardHeader>
            <CardContent><Bars months={r.byMonth.months} values={r.byMonth.collected} fmt={short} /></CardContent>
          </Card>
        </section>
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Theo nhóm dịch vụ</CardTitle>
              <CardDescription>Dòng của báo giá được chấp nhận trong năm; giá thành theo định mức tại thời điểm báo giá</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground"><tr><th className="text-left font-medium py-1">Nhóm</th><th className="text-right font-medium">Doanh thu</th><th className="text-right font-medium">Giá thành</th><th className="text-right font-medium">Lãi</th></tr></thead>
                <tbody className="divide-y">
                  {r.byCategory.map((c) => (
                    <tr key={c.category}>
                      <td className="py-1.5">{c.category}</td>
                      <td className="text-right whitespace-nowrap">{fmtVND(c.revenue)}</td>
                      <td className="text-right whitespace-nowrap text-muted-foreground">{c.cost ? fmtVND(c.cost) : "—"}</td>
                      <td className={`text-right ${c.margin != null && c.margin < 0 ? "text-rose-600" : ""}`}>{c.margin == null ? "—" : `${c.margin.toLocaleString("vi-VN")}%`}</td>
                    </tr>
                  ))}
                  {r.byCategory.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground text-xs">Chưa có báo giá được chấp nhận trong năm</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Theo khách hàng</CardTitle><CardDescription>Ký kết và đã thu trong năm</CardDescription></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground"><tr><th className="text-left font-medium py-1">Khách hàng</th><th className="text-right font-medium">Ký kết</th><th className="text-right font-medium">Đã thu</th></tr></thead>
                <tbody className="divide-y">
                  {r.byCustomer.slice(0, 15).map((c) => (
                    <tr key={c.id || "none"}>
                      <td className="py-1.5">{c.id ? <Link href={`/customers/${c.id}`} className="hover:underline">{c.name}</Link> : c.name}<div className="text-[11px] text-muted-foreground">{c.kind}</div></td>
                      <td className="text-right whitespace-nowrap">{fmtVND(c.contracted)}</td>
                      <td className="text-right whitespace-nowrap">{fmtVND(c.collected)}</td>
                    </tr>
                  ))}
                  {r.byCustomer.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground text-xs">Chưa có dữ liệu</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
