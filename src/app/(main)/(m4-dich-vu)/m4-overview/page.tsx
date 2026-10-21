import Link from "next/link";
import { BadgeCheck, FileSignature, FileText, Inbox, Wallet } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PipelineBoard, type Deal, type PipelineColumn } from "@/components/m4/overview/pipeline-board";
import { RevenueStrip, type RevenueStripData } from "@/components/m4/overview/revenue-strip";
import { PortalInbox, type InboxItem } from "@/components/m4/overview/portal-inbox";
import { ResearchPanel, type DeadlineItem, type ResearchPanelData } from "@/components/m4/overview/research-panel";
import { AlertsPanel, type OverviewAlert } from "@/components/m4/overview/alerts-panel";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { contractStore, interactionStore, invoiceStore, paymentStore, quotationStore } from "@/lib/modules/m4/data/sales";
import { serviceRequestStore } from "@/lib/modules/m4/data/portal";
import { agreementStore, ipAssetStore, knowledgeStore, partnerStore, techTransferStore, trainingStore } from "@/lib/modules/m4/data/knowledge";
import { researchTaskStore, taskMilestoneStore } from "@/lib/modules/m4/data/research";
import { agreementExpiryAlert, ipExpiryAlert } from "@/lib/modules/m4/knowledge";
import { contractAlerts, contractBalances, daysBetween, monthsOf, quotationTotal, sumByMonth } from "@/lib/modules/m4/finance";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tổng quan dịch vụ" };

/** Yêu cầu chưa phân xử lý quá số ngày này bị coi là chậm. */
const REQUEST_SLA_DAYS = 2;
const OPEN_QUOTE = ["Nháp", "Chờ duyệt", "Đã duyệt", "Đã gửi"] as const;
const OPEN_CONTRACT = ["Đang soạn", "Đã ký", "Đang thực hiện"] as const;
const DONE_CONTRACT = ["Đã nghiệm thu", "Đã thanh lý"];
const OPEN_TASK = ["Được phê duyệt", "Đang thực hiện", "Chờ nghiệm thu"];

/** Mỗi nguồn dữ liệu lỗi riêng thì trả rỗng, trang vẫn hiển thị. */
const safe = <T,>(p: Promise<T[]>) => p.catch(() => [] as T[]);

async function knowledgeCounts(): Promise<{ total: number | null; pub: number | null }> {
  try {
    if (isDbConfigured()) {
      const [r] = await dbQuery(`select count(*)::int total, count(*) filter (where is_public)::int pub from m4.knowledge_items`);
      return { total: Number(r?.total ?? 0), pub: Number(r?.pub ?? 0) };
    }
    const items = await knowledgeStore.list();
    return { total: items.length, pub: items.filter((i) => i.isPublic).length };
  } catch {
    return { total: null, pub: null };
  }
}

const shiftYear = (iso: string, by: number) => `${Number(iso.slice(0, 4)) + by}${iso.slice(4)}`;

export default async function M4OverviewPage() {
  const [requests, quotations, contracts, payments, invoices, interactions, customers, ipAssets, agreements, tasks, milestones, transfers, trainings, partners, knowledge] =
    await Promise.all([
      safe(serviceRequestStore.list()),
      safe(quotationStore.list()),
      safe(contractStore.list()),
      safe(paymentStore.list()),
      safe(invoiceStore.list()),
      safe(interactionStore.list()),
      safe(getCustomers()),
      safe(ipAssetStore.list()),
      safe(agreementStore.list()),
      safe(researchTaskStore.list()),
      safe(taskMilestoneStore.list()),
      safe(techTransferStore.list()),
      safe(trainingStore.list()),
      safe(partnerStore.list()),
      knowledgeCounts(),
    ]);

  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const customerById = byId(customers);
  const name = (id: string) => customerById.get(id)?.name ?? "";
  const balances = contractBalances(contracts, payments);
  const debtOf = (id: string) => balances.get(id)?.debt ?? 0;
  const billable = contracts.filter((c) => c.status !== "Đang soạn" && c.status !== "Hủy");
  const ageFrom = (d: string) => daysBetween((d || "").slice(0, 10), today);
  const count = <T,>(xs: T[], pred: (x: T) => boolean) => xs.filter(pred).length;

  // ── Phễu bán hàng ────────────────────────────────────────────────
  const newRequests = requests.filter((r) => r.status === "Mới tiếp nhận" || r.status === "Đang xử lý");
  const openQuotes = quotations.filter((q) => (OPEN_QUOTE as readonly string[]).includes(q.status));
  const openContracts = contracts.filter((c) => (OPEN_CONTRACT as readonly string[]).includes(c.status));
  const receivable = billable.filter((c) => DONE_CONTRACT.includes(c.status) && debtOf(c.id) > 0);
  const doneDate = (c: (typeof contracts)[number]) => c.deliveredAt || c.endAt || c.signedAt;
  const completed = billable
    .filter((c) => DONE_CONTRACT.includes(c.status) && debtOf(c.id) <= 0 && (doneDate(c) || "").startsWith(String(year)))
    .sort((a, b) => (doneDate(b) || "").localeCompare(doneDate(a) || ""));
  const receivableIds = new Set(receivable.map((c) => c.id));
  const receivableInvoices = count(invoices, (i) => i.status === "Đã phát hành" && receivableIds.has(i.contractId));

  const columns: PipelineColumn[] = [
    {
      key: "requests",
      title: "Yêu cầu mới",
      hint: "chưa định giá",
      icon: Inbox,
      href: "/request-inbox",
      count: newRequests.length,
      total: null,
      totalLabel: `${newRequests.reduce((s, r) => s + (Number(r.sampleCount) || 0), 0)} mẫu dự kiến`,
      breakdown: [
        { label: "Mới tiếp nhận", count: count(newRequests, (r) => r.status === "Mới tiếp nhận") },
        { label: "Đang xử lý", count: count(newRequests, (r) => r.status === "Đang xử lý") },
      ],
      deals: newRequests
        .map<Deal>((r) => ({
          id: r.id,
          href: `/request-inbox?box=all&id=${r.id}`,
          code: r.code,
          customer: r.orgName || r.contactName,
          service: r.kind,
          value: null,
          valueHint: r.sampleCount > 0 ? `${r.sampleCount} mẫu` : "Chưa báo giá",
          age: ageFrom(r.createdAt),
          ageWarn: [REQUEST_SLA_DAYS, REQUEST_SLA_DAYS * 3],
          owner: r.handler,
          status: r.status,
        }))
        .sort((a, b) => (b.age || 0) - (a.age || 0)),
    },
    {
      key: "quotes",
      title: "Báo giá",
      hint: "đang mở",
      icon: FileText,
      href: "/quotations",
      count: openQuotes.length,
      total: openQuotes.reduce((s, q) => s + quotationTotal(q.amount, q.vatRate), 0),
      breakdown: OPEN_QUOTE.map((st) => ({ label: st, count: count(openQuotes, (q) => q.status === st) })),
      deals: openQuotes
        .map<Deal>((q) => {
          const left = daysBetween(today, q.validUntil);
          const expired = q.status === "Đã gửi" && Number.isFinite(left) && left < 0;
          return {
            id: q.id,
            href: `/quotations/${q.id}`,
            code: q.code,
            customer: name(q.customerId),
            service: q.title,
            value: quotationTotal(q.amount, q.vatRate),
            age: ageFrom(q.issuedAt || q.submittedAt),
            ageLabel: expired ? `quá hiệu lực ${-left} ngày` : undefined,
            tone: expired ? "danger" : undefined,
            owner: q.preparedBy,
            status: q.status,
          };
        })
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    },
    {
      key: "contracts",
      title: "Hợp đồng",
      hint: "đã ký / đang thực hiện",
      icon: FileSignature,
      href: "/contracts",
      count: openContracts.length,
      total: openContracts.reduce((s, c) => s + (Number(c.value) || 0), 0),
      breakdown: OPEN_CONTRACT.map((st) => ({ label: st, count: count(openContracts, (c) => c.status === st) })),
      deals: openContracts
        .map<Deal>((c) => {
          const late = c.deliveredAt ? NaN : daysBetween(c.resultDueAt, today);
          return {
            id: c.id,
            href: `/contracts?q=${encodeURIComponent(c.code)}`,
            code: c.code,
            customer: name(c.customerId),
            service: c.title,
            value: Number(c.value) || 0,
            age: ageFrom(c.signedAt || c.startAt),
            ageLabel: late > 0 ? `trễ kết quả ${late} ngày` : undefined,
            ageWarn: [30, 60],
            tone: late > 0 ? "danger" : undefined,
            owner: c.owner,
            status: c.status,
          };
        })
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    },
    {
      key: "receivable",
      title: "Thanh toán / công nợ",
      hint: "đã nghiệm thu, chưa thu đủ",
      icon: Wallet,
      href: "/payments",
      count: receivable.length,
      total: receivable.reduce((s, c) => s + debtOf(c.id), 0),
      totalLabel: `${receivableInvoices} hóa đơn đã phát hành`,
      deals: receivable
        .map<Deal>((c) => {
          const overdue = daysBetween(c.paymentDueAt, today);
          return {
            id: c.id,
            href: `/contracts?q=${encodeURIComponent(c.code)}`,
            code: c.code,
            customer: name(c.customerId),
            service: c.title,
            value: debtOf(c.id),
            age: overdue,
            ageLabel: !Number.isFinite(overdue) ? "chưa đặt hạn" : overdue > 0 ? `quá hạn ${overdue} ngày` : `hạn ${fmtDateVN(c.paymentDueAt)}`,
            ageWarn: [1, 31],
            owner: c.owner,
            status: "còn nợ",
          };
        })
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    },
    {
      key: "done",
      title: "Hoàn thành",
      hint: `năm ${year}`,
      icon: BadgeCheck,
      href: "/revenue",
      count: completed.length,
      total: completed.reduce((s, c) => s + (Number(c.value) || 0), 0),
      totalLabel: `đã thu đủ · năm ${year}`,
      deals: completed.map<Deal>((c) => ({
        id: c.id,
        href: `/contracts?q=${encodeURIComponent(c.code)}`,
        code: c.code,
        customer: name(c.customerId),
        service: c.title,
        value: Number(c.value) || 0,
        age: NaN,
        ageLabel: fmtDateVN(doneDate(c)),
        tone: "muted",
        owner: c.owner,
        status: c.status,
      })),
    },
  ];

  // ── Doanh thu ────────────────────────────────────────────────────
  const paidIn = (from: string, to: string) =>
    payments
      .filter((p) => {
        const d = (p.paidAt || "").slice(0, 10);
        return d >= from && d <= to;
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const monthKey = today.slice(0, 7);
  const monthIdx = Number(today.slice(5, 7)) - 1;
  const prevMonthKey = monthIdx === 0 ? `${year - 1}-12` : `${year}-${String(monthIdx).padStart(2, "0")}`;
  const cutoff12m = new Date(Date.parse(today) - 365 * 86_400_000).toISOString().slice(0, 10);
  const recentQuotes = quotations.filter((q) => (q.issuedAt || "") >= cutoff12m);
  const won = recentQuotes.filter((q) => q.status === "Được chấp nhận");
  const decided = count(recentQuotes, (q) => q.status === "Được chấp nhận" || q.status === "Từ chối" || q.status === "Hết hạn");
  const quotedIds = new Set(contracts.map((c) => c.quotationId).filter(Boolean));
  let debt = 0;
  let overdueDebt = 0;
  let debtContracts = 0;
  for (const c of billable) {
    const d = debtOf(c.id);
    if (d <= 0) continue;
    debt += d;
    debtContracts += 1;
    if (daysBetween(c.paymentDueAt, today) > 0) overdueDebt += d;
  }
  const revenue: RevenueStripData = {
    monthLabel: `tháng ${monthIdx + 1}`,
    month: paidIn(`${monthKey}-01`, `${monthKey}-31`),
    prevMonth: paidIn(`${prevMonthKey}-01`, `${prevMonthKey}-31`),
    yearLabel: `năm ${year}`,
    ytd: paidIn(`${year}-01-01`, today),
    prevYtd: paidIn(`${year - 1}-01-01`, shiftYear(today, -1)),
    monthly: sumByMonth(payments, (p) => p.paidAt, (p) => p.amount, monthsOf(year)),
    currentMonthIndex: monthIdx,
    debt,
    overdueDebt,
    debtContracts,
    winRate: decided > 0 ? Math.round((won.length / decided) * 1000) / 10 : null,
    won: won.length,
    decided,
    wonWithContract: count(won, (q) => quotedIds.has(q.id)),
  };

  // ── Hộp thư cổng ─────────────────────────────────────────────────
  const awaiting = requests
    .filter((r) => r.status === "Mới tiếp nhận")
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const inbox: InboxItem[] = awaiting.slice(0, 6).map((r) => ({
    id: r.id,
    code: r.code,
    contactName: r.contactName,
    orgName: r.orgName,
    kind: r.kind,
    targetUnit: r.targetUnit,
    channel: r.channel,
    description: (r.description || "").slice(0, 200),
    age: ageFrom(r.createdAt),
  }));

  // ── Nghiên cứu & tri thức ────────────────────────────────────────
  const taskById = byId(tasks);
  const partnerById = byId(partners);
  const deadlines: DeadlineItem[] = [
    ...milestones
      .filter((m) => !m.doneAt && m.dueAt && OPEN_TASK.includes(taskById.get(m.taskId)?.status ?? ""))
      .map<DeadlineItem>((m) => ({
        id: `m-${m.id}`,
        href: `/research-tasks/${m.taskId}`,
        title: m.title,
        taskCode: taskById.get(m.taskId)?.code ?? "",
        dueAt: m.dueAt,
        days: daysBetween(today, m.dueAt),
        kind: "Mốc",
      })),
    ...tasks
      .filter((t) => t.endAt && (t.status === "Đang thực hiện" || t.status === "Được phê duyệt"))
      .map<DeadlineItem>((t) => ({
        id: `t-${t.id}`,
        href: `/research-tasks/${t.id}`,
        title: t.title,
        taskCode: t.code,
        dueAt: t.endAt,
        days: daysBetween(today, t.endAt),
        kind: "Kết thúc",
      })),
  ]
    .filter((d) => Number.isFinite(d.days) && d.days >= -60)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);
  const upcomingTrainings = trainings
    .filter((t) => t.status !== "Hủy" && (t.startAt || "") >= today)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const pastTrainings = trainings
    .filter((t) => t.status !== "Hủy" && (t.startAt || "") < today)
    .sort((a, b) => (b.startAt || "").localeCompare(a.startAt || ""));
  const research: ResearchPanelData = {
    activeTasks: count(tasks, (t) => t.status === "Đang thực hiện"),
    deadlines,
    transfers: [...transfers]
      .filter((t) => t.status !== "Hủy")
      .sort((a, b) => (b.signedAt || "").localeCompare(a.signedAt || ""))
      .slice(0, 3)
      .map((t) => ({ id: t.id, title: t.title, partner: partnerById.get(t.partnerId)?.name ?? "", signedAt: t.signedAt, value: Number(t.value) || 0, status: t.status })),
    trainings: [...upcomingTrainings, ...pastTrainings]
      .slice(0, 3)
      .map((t) => ({ id: t.id, title: t.title, startAt: t.startAt, status: t.status, planned: Number(t.planned) || 0, attended: Number(t.attended) || 0 })),
    knowledgeTotal: knowledge.total,
    knowledgePublic: knowledge.pub,
  };

  // ── Cảnh báo thời hạn ────────────────────────────────────────────
  const alerts: OverviewAlert[] = [];
  for (const r of requests) {
    const age = ageFrom(r.createdAt);
    if (r.status === "Mới tiếp nhận" && age >= REQUEST_SLA_DAYS) {
      alerts.push({ href: `/request-inbox?box=all&id=${r.id}`, code: r.code, who: r.contactName, text: `Yêu cầu chưa xử lý ${age} ngày · ${r.targetUnit}`, tone: "red" });
    }
  }
  for (const q of quotations) {
    if (q.status === "Chờ duyệt") alerts.push({ href: `/quotations/${q.id}`, code: q.code, who: name(q.customerId), text: "Báo giá chờ duyệt", tone: "amber" });
    const left = daysBetween(today, q.validUntil);
    if (q.status === "Đã gửi" && Number.isFinite(left) && left <= 7) {
      alerts.push({ href: `/quotations/${q.id}`, code: q.code, who: name(q.customerId), text: left < 0 ? `Báo giá quá hiệu lực ${-left} ngày – chuyển Hết hạn hoặc liên hệ khách` : `Báo giá còn ${left} ngày hiệu lực, khách chưa phản hồi`, tone: left < 0 ? "red" : "amber" });
    }
  }
  for (const c of contracts) {
    for (const a of contractAlerts(c, debtOf(c.id), today)) {
      alerts.push({ href: `/contracts?q=${encodeURIComponent(c.code)}`, code: c.code, who: name(c.customerId), text: `${a.kind}${a.days ? ` ${a.days} ngày` : " hôm nay"}`, tone: a.kind.startsWith("Sắp") ? "amber" : "red" });
    }
  }
  for (const i of interactions) {
    if (i.nextActionAt && i.nextAction && daysBetween(i.nextActionAt, today) >= 0) {
      alerts.push({ href: `/customers/${i.customerId}`, code: fmtDateVN(i.nextActionAt), who: name(i.customerId), text: `Việc chăm sóc đến hạn: ${i.nextAction}`, tone: "amber" });
    }
  }
  for (const a of ipAssets) {
    const x = ipExpiryAlert(a, today);
    if (x) alerts.push({ href: `/ip-assets?q=${encodeURIComponent(a.code)}`, code: a.code, who: a.title, text: `${x.kind} ${x.days} ngày`, tone: x.kind.startsWith("Văn bằng đã") ? "red" : "amber" });
  }
  for (const a of agreements) {
    const x = agreementExpiryAlert(a, today);
    if (x) alerts.push({ href: "/partners", code: a.code, who: a.title, text: `${x.kind} ${x.days} ngày`, tone: x.kind.endsWith("quá hạn") ? "red" : "amber" });
  }
  alerts.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "red" ? -1 : 1));

  return (
    <>
      <Header title="Tổng quan dịch vụ" description="Phễu bán hàng, doanh thu – công nợ và yêu cầu mới từ cổng dịch vụ" />
      <main className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-thin sm:p-6">
        <RevenueStrip data={revenue} />
        <PipelineBoard columns={columns} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <PortalInbox items={inbox} total={awaiting.length} slaDays={REQUEST_SLA_DAYS} />
            <p className="text-xs text-muted-foreground">
              Phân tích chi tiết theo tháng, nhóm dịch vụ và khách hàng ở{" "}
              <Link href="/revenue" className="font-medium text-primary hover:underline">Báo cáo doanh thu</Link>.
            </p>
          </div>
          <aside className="space-y-4" aria-label="Cảnh báo và nghiên cứu">
            <AlertsPanel alerts={alerts} />
            <ResearchPanel data={research} />
          </aside>
        </div>
      </main>
    </>
  );
}
