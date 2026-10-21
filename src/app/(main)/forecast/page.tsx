import { TrendingUp, Banknote, Beaker, Info } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatGrid } from "@/components/qms/stat-grid";
import { Bars } from "@/components/qms/bar-chart";
import { dbQuery } from "@/lib/db";
import { chemicalsStore } from "@/lib/data/chemicals";
import { chemicalUsageLogStore } from "@/lib/data/chemical-usage-logs";
import { daysToStockout, forecastSeries } from "@/lib/forecast";
import { lastMonths } from "@/lib/stats";
import { fmtDateVN, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phân tích & dự báo" };

const HORIZON = 6;
const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Bỏ các tháng 0 ở đầu chuỗi (trước khi có dữ liệu) để không kéo lệch xu hướng. */
function trimLeading(months: string[], values: number[]) {
  const i = values.findIndex((v) => v > 0);
  return i < 0 ? { months: [], values: [] } : { months: months.slice(i), values: values.slice(i) };
}

function addMonths(m: string, k: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + k, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function ForecastPage() {
  const today = todayISO();
  const months = lastMonths(today, 24);
  const [series, chemicals, usages] = await Promise.all([
    dbQuery(
      `select m as month,
         (select count(*)::int from analytics.fact_samples where to_char(received_at, 'YYYY-MM') = m) samples,
         (select coalesce(sum(total), 0) from analytics.fact_revenue where status in ('KH chấp nhận', 'Đã ký HĐ', 'Đã nhận mẫu') and month = m) revenue
       from unnest($1::text[]) m`,
      [months],
    ),
    chemicalsStore.list(),
    chemicalUsageLogStore.list(),
  ]);
  const build = (key: "samples" | "revenue") => {
    const t = trimLeading(months, series.map((s) => Number(s[key])));
    const f = forecastSeries(t.values, HORIZON);
    const fMonths = Array.from({ length: HORIZON }, (_, i) => addMonths(months[months.length - 1], i + 1));
    const shownHist = t.months.slice(-12);
    const shownVals = t.values.slice(-12);
    return { history: t, f, chartMonths: [...shownHist, ...fMonths], chartValues: [...shownVals, ...f.points.map((p) => p.value)], ghost: [...shownHist.map(() => false), ...fMonths.map(() => true)], fMonths };
  };
  const s = build("samples");
  const rv = build("revenue");
  const stock = chemicals
    .map((c) => ({ c, r: daysToStockout(Number(c.stock) || 0, usages.filter((u) => u.chemicalCode === c.code), today) }))
    .filter((x) => x.r.perDay > 0)
    .sort((a, b) => a.r.days - b.r.days);
  const soon = stock.filter((x) => x.r.days <= 30).length;
  const next3 = s.f.points.slice(0, 3).reduce((a, p) => a + p.value, 0);

  return (
    <>
      <Header title="Phân tích dữ liệu & dự báo" description="M1.6 – dự báo số mẫu, doanh thu (làm trơn hàm mũ Holt) và ngày hết tồn kho hóa chất theo mức tiêu thụ thực tế" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mẫu dự báo 3 tháng tới", value: Math.round(next3), icon: TrendingUp, accent: "bg-blue-50 text-blue-600", hint: s.f.method },
            { label: "Doanh thu dự báo 3 tháng", value: vnd(rv.f.points.slice(0, 3).reduce((a, p) => a + p.value, 0)), icon: Banknote, accent: "bg-violet-50 text-violet-600", hint: "VNĐ" },
            { label: "Hóa chất hết trong 30 ngày", value: soon, icon: Beaker, accent: soon ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700", hint: `${stock.length} hóa chất có tiêu thụ 90 ngày` },
            { label: "Dữ liệu lịch sử", value: `${s.history.values.length} tháng`, icon: Info, accent: "bg-amber-50 text-amber-600", hint: s.history.values.length < 12 ? "cần ≥ 12 tháng để dự báo tin cậy" : "đủ để dự báo" },
          ]}
        />
        {[{ t: "Số mẫu tiếp nhận", d: s, money: false }, { t: "Doanh thu (VNĐ)", d: rv, money: true }].map(({ t, d, money }) => (
          <Card key={t}>
            <CardHeader>
              <CardTitle className="text-base">{t}: 12 tháng gần nhất + dự báo {HORIZON} tháng</CardTitle>
              <CardDescription>{d.f.method}{d.f.fit ? ` · RMSE dự báo 1 bước = ${money ? vnd(d.f.fit.rmse) : r1(d.f.fit.rmse)}` : ""} · cột nét đứt = dự báo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Bars months={d.chartMonths} values={d.chartValues} ghost={d.ghost} fmt={money ? (n) => `${vnd(n / 1e6)}tr` : (n) => String(Math.round(n))} />
              <div className="rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Tháng</TableHead><TableHead className="text-right">Dự báo</TableHead><TableHead className="text-right">Khoảng 95% (xấp xỉ)</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {d.f.points.map((p, i) => (
                      <TableRow key={p.step}>
                        <TableCell className="text-sm">{d.fMonths[i].slice(5)}/{d.fMonths[i].slice(0, 4)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{money ? vnd(p.value) : r1(p.value)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{money ? `${vnd(p.lower)} – ${vnd(p.upper)}` : `${r1(p.lower)} – ${r1(p.upper)}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader><CardTitle className="text-base">Dự báo hết tồn kho hóa chất</CardTitle><CardDescription>Tồn hiện tại ÷ lượng dùng trung bình / ngày trong 90 ngày gần nhất (theo sổ xuất dùng hóa chất)</CardDescription></CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Hóa chất</TableHead><TableHead className="text-right">Tồn</TableHead><TableHead className="text-right">Dùng / ngày</TableHead><TableHead className="text-right">Còn đủ dùng</TableHead><TableHead>Ngày dự kiến hết</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stock.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Chưa có ghi nhận xuất dùng hóa chất trong 90 ngày</TableCell></TableRow>}
                  {stock.map(({ c, r }) => {
                    const end = new Date(Date.parse(today) + Math.floor(r.days) * 86_400_000).toISOString().slice(0, 10);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{c.name}<div className="text-[11px] font-mono text-muted-foreground">{c.code}</div></TableCell>
                        <TableCell className="text-right text-sm">{c.stock} {c.unit}</TableCell>
                        <TableCell className="text-right text-sm">{r1(r.perDay * 100) / 100} {c.unit}</TableCell>
                        <TableCell className="text-right"><Badge variant={r.days <= 14 ? "destructive" : r.days <= 30 ? "warning" : "success"}>{Math.floor(r.days)} ngày</Badge></TableCell>
                        <TableCell className="text-sm">{fmtDateVN(end)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Phương pháp: làm trơn hàm mũ Holt (xu hướng tuyến tính), tham số α, β chọn trên lưới 0,05–0,95 theo sai số dự báo 1 bước nhỏ nhất; dưới 4 tháng dữ liệu dùng trung bình. Khoảng dự báo ±1,96·RMSE·√h là xấp xỉ, giả định sai số độc lập. Kết quả dùng để tham khảo lập kế hoạch, không thay thế đánh giá chuyên môn.
        </p>
      </main>
    </>
  );
}
