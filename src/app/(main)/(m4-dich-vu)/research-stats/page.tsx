import Link from "next/link";
import { Download, FlaskConical, CheckCircle2, Banknote, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/common/stat-grid";
import { researchStats } from "@/lib/modules/m4/data/research-stats";
import { fmtVND } from "@/lib/modules/m4/finance";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thống kê KH&CN" };

function BarList({ items, fmt = String }: { items: { label: string; value: number }[]; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-xs text-muted-foreground">Chưa có dữ liệu</p>;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between text-sm mb-1"><span>{i.label}</span><span className="text-xs text-muted-foreground">{fmt(i.value)}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary/80" style={{ width: `${(i.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default async function ResearchStatsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const thisYear = Number(todayISO().slice(0, 4));
  const year = Math.min(thisYear + 1, Math.max(2015, Number((await searchParams).year) || thisYear));
  const s = await researchStats(year);
  const n = (xs: { label: string; n: number }[]) => xs.map((x) => ({ label: x.label, value: x.n }));

  return (
    <>
      <Header title="Thống kê KH&CN" description="Số liệu định kỳ về nhiệm vụ, kinh phí, kết quả nghiệm thu và nhân lực nghiên cứu" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {[thisYear - 2, thisYear - 1, thisYear].map((y) => (
            <Link key={y} href={`/research-stats?year=${y}`} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${y === year ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
              Năm {y}
            </Link>
          ))}
          <a href={`/api/m4-reports/research?year=${year}`} className="ml-auto h-8 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent">
            <Download className="w-4 h-4" /> Xuất CSV
          </a>
        </div>
        <StatGrid
          stats={[
            { label: `Nhiệm vụ thực hiện ${year}`, value: s.totals.tasksInYear, icon: FlaskConical, accent: "bg-blue-50 text-blue-600", hint: `${s.totals.approvedInYear} phê duyệt mới trong năm` },
            { label: `Nghiệm thu ${year}`, value: s.totals.acceptedInYear, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
            { label: `Giải ngân ${year}`, value: fmtVND(s.totals.spentInYear), icon: Banknote, accent: "bg-violet-50 text-violet-600", hint: `kinh phí phê duyệt mới ${fmtVND(s.totals.budgetApprovedInYear)}` },
            { label: "Nhân lực nghiên cứu", value: s.totals.researchers, icon: Users, accent: "bg-amber-50 text-amber-600", hint: `${s.totals.fieldTrialsInYear} thí nghiệm đồng ruộng bắt đầu trong năm` },
          ]}
        />
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle>Theo cấp quản lý</CardTitle></CardHeader><CardContent><BarList items={n(s.byLevel)} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Theo lĩnh vực</CardTitle></CardHeader><CardContent><BarList items={n(s.byField)} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Trạng thái (toàn bộ)</CardTitle></CardHeader><CardContent><BarList items={n(s.byStatus)} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Kết quả nghiệm thu {year}</CardTitle></CardHeader><CardContent><BarList items={n(s.byAcceptance)} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Nhân lực theo học vị</CardTitle></CardHeader><CardContent><BarList items={n(s.byDegree)} /></CardContent></Card>
          <Card>
            <CardHeader><CardTitle>Giải ngân theo nội dung chi {year}</CardTitle></CardHeader>
            <CardContent><BarList items={s.spentByCategory.map((x) => ({ label: x.label, value: x.amount }))} fmt={fmtVND} /></CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
