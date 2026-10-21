import Link from "next/link";

export type CalendarEvent = { key: string; date: string; label: string; title: string; href: string; tone: string };
export type CalendarDay = { date: string; inMonth: boolean };

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
/** Số sự kiện tối đa hiển thị trong một ô ngày. */
const PER_DAY = 4;

/** Lịch tháng (tuần bắt đầu thứ Hai); mỗi ô liệt kê sự kiện theo màu loại việc. */
export function MonthCalendar({ weeks, events, today }: { weeks: CalendarDay[][]; events: CalendarEvent[]; today: string }) {
  const byDate = new Map<string, CalendarEvent[]>();
  for (const e of events) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card scrollbar-thin">
      <div className="grid min-w-[52rem] grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div key={d} className="border-b bg-muted/40 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
        {weeks.flat().map((day) => {
          const list = byDate.get(day.date) ?? [];
          const isToday = day.date === today;
          return (
            <div key={day.date} className={`min-h-[7.5rem] border-b border-r p-1.5 ${day.inMonth ? "" : "bg-muted/30 text-muted-foreground"} ${day.date < today ? "opacity-75" : ""}`}>
              <div className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums ${isToday ? "bg-primary font-semibold text-primary-foreground" : ""}`}>{Number(day.date.slice(8))}</div>
              <ul className="space-y-0.5">
                {list.slice(0, PER_DAY).map((e) => (
                  <li key={e.key}>
                    <Link href={e.href} title={e.title} className={`block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight hover:ring-1 hover:ring-ring ${e.tone}`}>{e.label}</Link>
                  </li>
                ))}
                {list.length > PER_DAY && <li className="px-1.5 text-[11px] text-muted-foreground">+{list.length - PER_DAY} việc khác</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
