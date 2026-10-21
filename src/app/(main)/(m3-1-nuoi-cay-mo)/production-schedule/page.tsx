import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { cultureBatchStore, productionProfileStore, seedlingLotStore, seedlingOrderStore } from "@/lib/modules/m3/data/tissue";
import { planOrder } from "@/lib/modules/m3/production";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Điều độ sản xuất" };

type Item = { date: string; kind: "Cấy chuyển" | "Bắt đầu nhân" | "Đưa ra rễ" | "Ra ngôi" | "Lô đủ tiêu chuẩn" | "Giao hàng"; code: string; href: string; text: string };

const kindVariant: Record<Item["kind"], "default" | "secondary" | "warning" | "success" | "outline"> = {
  "Cấy chuyển": "default",
  "Bắt đầu nhân": "warning",
  "Đưa ra rễ": "warning",
  "Ra ngôi": "warning",
  "Lô đủ tiêu chuẩn": "success",
  "Giao hàng": "outline",
};

/** Mondays: tuần bắt đầu thứ Hai chứa ngày `iso`. */
const weekOf = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - shift * 86_400_000).toISOString().slice(0, 10);
};

function ScheduleList({ list }: { list: Item[] }) {
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

/** Lịch điều độ (M3.1.5): cấy chuyển đến hạn, mốc kế hoạch của đơn hàng, lô sắp đủ tiêu chuẩn, ngày giao. */
export default async function ProductionSchedulePage({ searchParams }: { searchParams: Promise<{ weeks?: string }> }) {
  const weeks = [4, 8, 12].includes(Number((await searchParams).weeks)) ? Number((await searchParams).weeks) : 8;
  const [batches, orders, profiles, lots, customers] = await Promise.all([
    cultureBatchStore.list(),
    seedlingOrderStore.list(),
    productionProfileStore.list(),
    seedlingLotStore.list(),
    getCustomers(),
  ]);
  const today = todayISO();
  const end = new Date(Date.parse(today) + weeks * 7 * 86_400_000).toISOString().slice(0, 10);
  const profileById = byId(profiles);
  const customerById = byId(customers);
  const items: Item[] = [];
  for (const b of batches) {
    if (b.status === "Đang nuôi" && b.nextTransferAt) items.push({ date: b.nextTransferAt, kind: "Cấy chuyển", code: b.code, href: `/culture-batches/${b.id}`, text: `${b.stage} · ${b.vessels} bình · ${b.operator || "chưa phân công"}` });
  }
  for (const o of orders) {
    if (!["Mới", "Đã xác nhận", "Đang sản xuất", "Giao một phần"].includes(o.status) || !o.dueAt) continue;
    const who = customerById.get(o.customerId)?.name ?? "";
    items.push({ date: o.dueAt, kind: "Giao hàng", code: o.code, href: `/seedling-orders/${o.id}`, text: `${o.quantity.toLocaleString("vi-VN")} cây ${o.species} ${o.variety} · ${who}` });
    const p = profileById.get(o.profileId);
    const plan = p ? planOrder(o, p, { stockShoots: batches.filter((b) => b.orderId === o.id && b.status === "Đang nuôi").reduce((s, b) => s + b.plantlets, 0) || 100, today }) : null;
    if (plan?.dates) {
      if (plan.cycles > 0) items.push({ date: plan.dates.multiplyBy, kind: "Bắt đầu nhân", code: o.code, href: `/seedling-orders/${o.id}`, text: `${plan.cycles} lần cấy chuyển · ${o.species} ${o.variety}` });
      items.push({ date: plan.dates.rootingBy, kind: "Đưa ra rễ", code: o.code, href: `/seedling-orders/${o.id}`, text: `${plan.toRoot.toLocaleString("vi-VN")} chồi` });
      items.push({ date: plan.dates.acclimatizeBy, kind: "Ra ngôi", code: o.code, href: `/seedling-orders/${o.id}`, text: `${plan.toAcclimatize.toLocaleString("vi-VN")} cây` });
    }
  }
  for (const l of lots) {
    if (l.status === "Vườn ươm" && l.readyAt) items.push({ date: l.readyAt, kind: "Lô đủ tiêu chuẩn", code: l.code, href: `/seedling-lots?q=${encodeURIComponent(l.code)}`, text: `${l.survived} cây sống · luống ${l.nurseryBed || "—"}` });
  }
  const overdue = items.filter((i) => i.date < today && i.kind !== "Lô đủ tiêu chuẩn").sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = items.filter((i) => i.date >= today && i.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  const byWeek = new Map<string, Item[]>();
  for (const i of upcoming) byWeek.set(weekOf(i.date), [...(byWeek.get(weekOf(i.date)) ?? []), i]);


  return (
    <>
      <Header title="Điều độ sản xuất" description="Lịch các tuần tới: cấy chuyển đến hạn, mốc kế hoạch theo đơn hàng, lô vườn ươm đủ tiêu chuẩn, ngày giao" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex gap-2">
          {[4, 8, 12].map((w) => (
            <Link key={w} href={`/production-schedule?weeks=${w}`} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${w === weeks ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>{w} tuần</Link>
          ))}
        </div>
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
      </main>
    </>
  );
}
