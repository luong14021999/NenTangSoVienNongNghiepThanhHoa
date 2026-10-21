import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthCalendar } from "@/components/m3/bench/month-calendar";
import { SCHEDULE_KINDS, loadSchedule, type ScheduleItem, type ScheduleKind } from "@/lib/modules/m3/data/schedule";
import { addDays, monthGrid, parseMonth, shiftMonth } from "@/lib/modules/m3/bench";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Điều độ sản xuất" };

const kindVariant: Record<ScheduleKind, "default" | "secondary" | "warning" | "success" | "outline"> = {
  "Cấy chuyển": "default",
  "Bắt đầu nhân": "warning",
  "Đưa ra rễ": "warning",
  "Ra ngôi": "warning",
  "Lô đủ tiêu chuẩn": "success",
  "Giao hàng": "outline",
  "Môi trường hết hạn": "secondary",
};
/** Màu ô sự kiện trên lịch tháng (lớp tĩnh để Tailwind sinh được). */
const kindTone: Record<ScheduleKind, string> = {
  "Cấy chuyển": "bg-primary/15 text-primary",
  "Bắt đầu nhân": "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  "Đưa ra rễ": "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200",
  "Ra ngôi": "bg-lime-100 text-lime-900 dark:bg-lime-900/40 dark:text-lime-200",
  "Lô đủ tiêu chuẩn": "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  "Giao hàng": "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  "Môi trường hết hạn": "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
};
const SHORT: Record<ScheduleKind, string> = {
  "Cấy chuyển": "Cấy",
  "Bắt đầu nhân": "Nhân",
  "Đưa ra rễ": "Ra rễ",
  "Ra ngôi": "Ra ngôi",
  "Lô đủ tiêu chuẩn": "Đủ chuẩn",
  "Giao hàng": "Giao",
  "Môi trường hết hạn": "HSD MT",
};

/** Mondays: tuần bắt đầu thứ Hai chứa ngày `iso`. */
const weekOf = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return addDays(iso, -((d.getUTCDay() + 6) % 7));
};

function ScheduleList({ list }: { list: ScheduleItem[] }) {
  return (
    <ul className="divide-y text-sm">
      {list.map((i, n) => (
        <li key={`${i.kind}-${i.code}-${n}`} className="py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs w-20 shrink-0 tabular-nums">{fmtDateVN(i.date)}</span>
          <Badge variant={kindVariant[i.kind]}>{i.kind}</Badge>
          <Link href={i.href} className="font-mono text-xs text-primary hover:underline">{i.code}</Link>
          <span className="text-xs text-muted-foreground min-w-0">{i.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Điều độ sản xuất (M3.1.5): lịch tháng là màn hình chính; danh sách theo tuần là chế độ xem phụ. */
export default async function ProductionSchedulePage({ searchParams }: { searchParams: Promise<{ view?: string; month?: string; weeks?: string }> }) {
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "month";
  const weeks = [4, 8, 12].includes(Number(sp.weeks)) ? Number(sp.weeks) : 8;
  const today = todayISO();
  const month = parseMonth(sp.month, today);
  const items = await loadSchedule(today);
  const overdue = items.filter((i) => i.date < today && i.kind !== "Lô đủ tiêu chuẩn" && i.kind !== "Môi trường hết hạn");

  const tab = (href: string, label: string, active: boolean) => (
    <Link key={href} href={href} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>{label}</Link>
  );

  let body;
  if (view === "month") {
    const grid = monthGrid(month);
    const first = grid[0][0].date;
    const last = grid.at(-1)!.at(-1)!.date;
    const shown = items.filter((i) => i.date >= first && i.date <= last);
    const [y, m] = month.split("-");
    body = (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/production-schedule?month=${shiftMonth(month, -1)}`} aria-label="Tháng trước" className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-accent"><ChevronLeft className="h-4 w-4" /></Link>
          <h2 className="min-w-36 text-center text-base font-semibold">Tháng {Number(m)}/{y}</h2>
          <Link href={`/production-schedule?month=${shiftMonth(month, 1)}`} aria-label="Tháng sau" className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-accent"><ChevronRight className="h-4 w-4" /></Link>
          {month !== today.slice(0, 7) && <Link href="/production-schedule" className="text-xs text-primary hover:underline">Về tháng này</Link>}
          <div className="ml-auto flex flex-wrap gap-1.5">
            {SCHEDULE_KINDS.map((k) => <span key={k} className={`rounded px-1.5 py-0.5 text-[11px] ${kindTone[k]}`}>{k}</span>)}
          </div>
        </div>
        <MonthCalendar
          weeks={grid}
          today={today}
          events={shown.map((i, n) => ({ key: `${i.kind}-${i.code}-${n}`, date: i.date, label: `${SHORT[i.kind]} · ${i.code}`, title: `${i.kind} · ${i.code} – ${i.text}`, href: i.href, tone: kindTone[i.kind] }))}
        />
        {overdue.length > 0 && (
          <Card className="border-rose-200">
            <CardHeader><CardTitle className="text-rose-700">Quá hạn chưa xử lý ({overdue.length})</CardTitle></CardHeader>
            <CardContent><ScheduleList list={overdue} /></CardContent>
          </Card>
        )}
      </>
    );
  } else {
    const end = addDays(today, weeks * 7);
    const upcoming = items.filter((i) => i.date >= today && i.date <= end);
    const byWeek = new Map<string, ScheduleItem[]>();
    for (const i of upcoming) byWeek.set(weekOf(i.date), [...(byWeek.get(weekOf(i.date)) ?? []), i]);
    body = (
      <>
        <div className="flex gap-2">{[4, 8, 12].map((w) => tab(`/production-schedule?view=list&weeks=${w}`, `${w} tuần`, w === weeks))}</div>
        {overdue.length > 0 && (
          <Card className="border-rose-200">
            <CardHeader><CardTitle className="text-rose-700">Quá hạn ({overdue.length})</CardTitle></CardHeader>
            <CardContent><ScheduleList list={overdue} /></CardContent>
          </Card>
        )}
        {[...byWeek.entries()].map(([week, list]) => (
          <Card key={week}>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="w-4 h-4" />Tuần từ {fmtDateVN(week)} <span className="text-sm font-normal text-muted-foreground">({list.length} việc)</span></CardTitle></CardHeader>
            <CardContent><ScheduleList list={list} /></CardContent>
          </Card>
        ))}
        {upcoming.length === 0 && overdue.length === 0 && <p className="text-sm text-muted-foreground">Không có việc trong {weeks} tuần tới.</p>}
      </>
    );
  }

  return (
    <>
      <Header title="Điều độ sản xuất" description="Lịch tháng: cấy chuyển đến hạn, mốc kế hoạch theo đơn hàng, lô vườn ươm đủ tiêu chuẩn, ngày giao, lô môi trường hết hạn" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
        <div className="flex gap-2">
          {tab(`/production-schedule${sp.month ? `?month=${month}` : ""}`, "Lịch tháng", view === "month")}
          {tab("/production-schedule?view=list", "Danh sách theo tuần", view === "list")}
        </div>
        {body}
      </main>
    </>
  );
}
