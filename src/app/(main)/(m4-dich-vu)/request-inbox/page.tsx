import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Globe, Mail, MessageSquarePlus, Phone, Reply, UserCheck, UserPlus, XCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/platform/action-button";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { initials } from "@/components/m4/overview/format";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { serviceRequestStore, type ServiceRequest } from "@/lib/modules/m4/data/portal";
import { INTERACTION_KINDS, interactionStore, quotationStore } from "@/lib/modules/m4/data/sales";
import { REQUEST_STATUSES, TARGET_UNITS } from "@/lib/modules/m4/portal";
import { INBOX_BOXES, boxOf, matchCustomer, parseBox } from "@/lib/modules/m4/workspace";
import { quotationStatusVariant } from "@/lib/modules/m4/ui";
import { currentAccess } from "@/lib/platform/data/access";
import { listChanges } from "@/lib/platform/data/change-log";
import { matches } from "@/lib/platform/ref-options";
import { daysUntil, fmtDateTimeVN, fmtDateVN, todayISO } from "@/lib/platform/dates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hộp thư yêu cầu" };

/** Số ngày phải phản hồi yêu cầu mới (đồng bộ với trang tổng quan M4). */
const SLA_DAYS = 2;
/** Số trao đổi / thay đổi gần nhất hiện trong khung chi tiết. */
const HISTORY = 6;

const unitKey = (u: string) => u.split(" – ")[0];
const ageOf = (r: ServiceRequest) => Math.max(0, -daysUntil(r.createdAt));
const ageText = (d: number) => (d === 0 ? "hôm nay" : `${d} ngày`);

/** M4.1 – hộp thư xử lý yêu cầu: danh sách bên trái, chi tiết + thao tác bên phải. */
export default async function RequestInboxPage({ searchParams }: { searchParams: Promise<{ box?: string; unit?: string; id?: string; q?: string }> }) {
  const sp = await searchParams;
  const box = parseBox(sp.box);
  const unit = TARGET_UNITS.map(unitKey).includes(sp.unit ?? "") ? sp.unit! : "";
  const query = (sp.q ?? "").trim().toLowerCase();
  const [all, customers, quotations, interactions, access] = await Promise.all([
    serviceRequestStore.list(),
    getCustomers(),
    quotationStore.list(),
    interactionStore.list(),
    currentAccess(),
  ]);
  const today = todayISO();
  const inUnit = all.filter((r) => !unit || unitKey(r.targetUnit) === unit);
  const list = inUnit
    .filter((r) => (box === "all" || boxOf(r.status) === box) && matches(query, r.code, r.contactName, r.orgName, r.phone, r.description))
    .sort((a, b) => (box === "new" ? (a.createdAt || "").localeCompare(b.createdAt || "") : (b.createdAt || "").localeCompare(a.createdAt || "")));
  const selected = all.find((r) => r.id === sp.id) ?? null;

  const qs = (o: { box?: string; unit?: string; id?: string }) => {
    const p = new URLSearchParams();
    const b = o.box ?? box;
    if (b !== "new") p.set("box", b);
    const u = o.unit ?? unit;
    if (u) p.set("unit", u);
    if (sp.q) p.set("q", sp.q);
    if (o.id) p.set("id", o.id);
    return `/request-inbox${p.size ? `?${p}` : ""}`;
  };

  const handlingFields: CrudField[] = [
    { name: "targetUnit", label: "Đơn vị xử lý", type: "select", options: [...TARGET_UNITS] },
    { name: "handler", label: "Cán bộ xử lý" },
    { name: "status", label: "Trạng thái", type: "select", options: [...REQUEST_STATUSES] },
    { name: "note", label: "Ghi chú nội bộ (không công bố)", type: "textarea" },
  ];
  const replyFields: CrudField[] = [
    { name: "publicNote", label: "Phản hồi cho khách (hiện khi khách tra cứu bằng mã + số điện thoại)", type: "textarea", required: true },
    { name: "status", label: "Trạng thái", type: "select", options: [...REQUEST_STATUSES] },
  ];

  let detail = null;
  if (selected) {
    const r = selected;
    const customer = customers.find((c) => c.id === r.customerId) ?? null;
    const suggested = customer ? null : matchCustomer(r, customers);
    const quotation = quotations.find((q) => q.id === r.quotationId) ?? null;
    const history = customer ? interactions.filter((i) => i.customerId === customer.id).sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || "")).slice(0, HISTORY) : [];
    const changes = await listChanges({ entity: "service-requests", entityId: r.id, limit: HISTORY }).catch(() => []);
    const closed = boxOf(r.status) === "closed";
    const canRequests = access.can("write.requests");
    const canServices = access.can("write.services");
    detail = (
      <article className="flex min-h-0 flex-col">
        <header className="border-b p-4 sm:p-5">
          <Link href={qs({})} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground lg:hidden"><ArrowLeft className="h-3.5 w-3.5" />Hộp thư</Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold">{r.code}</span>
            <Badge variant={boxOf(r.status) === "new" ? "destructive" : closed ? "secondary" : "default"}>{r.status}</Badge>
            <Badge variant="outline">{r.kind}</Badge>
            <span className="text-xs text-muted-foreground">{r.channel === "Trực tuyến" ? <Globe className="mr-1 inline h-3.5 w-3.5" /> : <Phone className="mr-1 inline h-3.5 w-3.5" />}{r.channel} · {fmtDateTimeVN(r.createdAt)}</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold">{r.contactName}{r.orgName && <span className="font-normal text-muted-foreground"> · {r.orgName}</span>}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Phone className="h-3.5 w-3.5" />{r.phone}</a>}
            {r.email && <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Viện Nông nghiệp Thanh Hóa – yêu cầu ${r.code}`)}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{r.email}</a>}
            {r.address && <span className="text-muted-foreground">{r.address}</span>}
          </div>
        </header>

        <div className="flex flex-wrap gap-2 border-b bg-muted/30 px-4 py-3 sm:px-5">
          {canRequests && (
            <>
              <EntityFormDialog mode="edit" endpoint="/api/service-requests" id={r.id} title={`Phân công – ${r.code}`} fields={handlingFields} initial={{ ...r, status: r.status === "Mới tiếp nhận" ? "Đang xử lý" : r.status }} successText="Đã phân công" trigger={<Button size="sm" variant="outline"><UserCheck />Phân công</Button>} />
              <EntityFormDialog mode="edit" endpoint="/api/service-requests" id={r.id} title={`Trả lời khách – ${r.code}`} description="Khách xem nội dung này tại trang tra cứu của cổng dịch vụ." fields={replyFields} initial={r} successText="Đã lưu phản hồi" trigger={<Button size="sm" variant="outline"><Reply />Trả lời khách</Button>} />
            </>
          )}
          {canRequests && !customer && (
            <ActionButton
              url={`/api/service-requests/${r.id}/customer`}
              label={suggested ? `Gắn khách ${suggested.code}` : "Lập hồ sơ khách hàng"}
              icon={<UserPlus />}
              confirm={suggested ? `Gắn yêu cầu với khách hàng sẵn có ${suggested.code} · ${suggested.name}?` : `Lập hồ sơ khách hàng mới “${r.orgName || r.contactName}” từ yêu cầu này?`}
              success={suggested ? "Đã gắn khách hàng" : "Đã lập hồ sơ khách hàng"}
            />
          )}
          {canServices && customer && !quotation && !closed && (
            <ActionButton url={`/api/service-requests/${r.id}/quotation`} label="Lập báo giá" icon={<FileSpreadsheet />} variant="default" confirm="Lập báo giá nháp cho yêu cầu này? Sau đó thêm dòng dịch vụ từ bảng giá." success="Đã lập báo giá nháp" />
          )}
          {canRequests && !closed && (
            <>
              <ActionButton url={`/api/service-requests/${r.id}`} method="PATCH" body={{ status: "Hoàn thành" }} label="Hoàn thành" icon={<CheckCircle2 />} confirm="Đánh dấu yêu cầu đã hoàn thành?" success="Đã đóng yêu cầu" />
              <ActionButton url={`/api/service-requests/${r.id}`} method="PATCH" body={{ status: "Từ chối" }} label="Từ chối" icon={<XCircle />} variant="ghost" confirm="Từ chối yêu cầu? Nên ghi lý do ở mục “Trả lời khách” để khách tra cứu được." success="Đã từ chối" />
            </>
          )}
          {canRequests && closed && <ActionButton url={`/api/service-requests/${r.id}`} method="PATCH" body={{ status: "Đang xử lý" }} label="Mở lại" confirm="Mở lại yêu cầu?" success="Đã mở lại" />}
        </div>

        <div className="space-y-5 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nội dung yêu cầu{r.sampleCount > 0 && ` · ${r.sampleCount} mẫu`}</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{r.description}</p>
          </section>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-[11px] text-muted-foreground">Đơn vị xử lý</div>
              <div className="font-medium">{r.targetUnit || "—"}</div>
              <div className="text-xs text-muted-foreground">{r.handler || "chưa phân công"}</div>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-[11px] text-muted-foreground">Khách hàng</div>
              {customer ? <Link href={`/customers?q=${encodeURIComponent(customer.code)}`} className="font-medium text-primary hover:underline">{customer.code} · {customer.name}</Link> : <div className="text-xs text-muted-foreground">{suggested ? `Gợi ý: ${suggested.code} · ${suggested.name}` : "Chưa có hồ sơ"}</div>}
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-[11px] text-muted-foreground">Báo giá</div>
              {quotation ? (
                <Link href={`/quotations/${quotation.id}`} className="inline-flex flex-wrap items-center gap-1.5 font-medium text-primary hover:underline">{quotation.code}<Badge variant={quotationStatusVariant[quotation.status] ?? "secondary"}>{quotation.status}</Badge></Link>
              ) : (
                <div className="text-xs text-muted-foreground">{customer ? "Chưa lập" : "Gắn khách hàng trước"}</div>
              )}
            </div>
          </section>
          {r.publicNote && (
            <section className="rounded-lg border-l-4 border-l-primary bg-primary/5 p-3">
              <h3 className="text-[11px] font-semibold text-primary">Đã phản hồi khách</h3>
              <p className="whitespace-pre-line text-sm">{r.publicNote}</p>
            </section>
          )}
          {r.note && <p className="text-xs text-muted-foreground">Ghi chú nội bộ: {r.note}</p>}

          {customer && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trao đổi với khách</h3>
                {canRequests && (
                  <div className="ml-auto">
                    <EntityFormDialog
                      mode="add"
                      endpoint="/api/customer-interactions"
                      title={`Ghi nhận trao đổi – ${customer.name}`}
                      fields={[
                        { name: "customerId", label: "Khách hàng", type: "select", options: [{ value: customer.id, label: `${customer.code} · ${customer.name}` }] },
                        { name: "kind", label: "Hình thức", type: "select", options: [...INTERACTION_KINDS] },
                        { name: "occurredAt", label: "Ngày", type: "date" },
                        { name: "staff", label: "Cán bộ" },
                        { name: "content", label: "Nội dung trao đổi", type: "textarea", required: true },
                        { name: "nextAction", label: "Việc tiếp theo" },
                        { name: "nextActionAt", label: "Hạn việc tiếp theo", type: "date" },
                      ]}
                      initial={{ customerId: customer.id, occurredAt: today, kind: r.channel === "Email" ? "Email" : "Gọi điện", content: `Về yêu cầu ${r.code}: ` }}
                      successText="Đã ghi nhận"
                      trigger={<Button size="sm" variant="outline" className="h-7 px-2 text-[11px]"><MessageSquarePlus />Ghi nhận</Button>}
                    />
                  </div>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có trao đổi nào được ghi.</p>
              ) : (
                <ol className="space-y-2 border-l pl-4">
                  {history.map((i) => (
                    <li key={i.id} className="relative text-sm">
                      <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
                      <div className="text-[11px] text-muted-foreground">{fmtDateVN(i.occurredAt)} · {i.kind}{i.staff && ` · ${i.staff}`}</div>
                      <div className="whitespace-pre-line">{i.content}</div>
                      {i.nextAction && <div className="text-xs text-amber-700 dark:text-amber-400">→ {i.nextAction}{i.nextActionAt && ` (hạn ${fmtDateVN(i.nextActionAt)})`}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {changes.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lịch sử xử lý</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {changes.map((c) => (
                  <li key={c.id}>{fmtDateTimeVN(c.at)} · {c.actor || "hệ thống"} · {c.action}{c.changes.length > 0 && `: ${c.changes.map((x) => `${x.field} ${x.old || "∅"} → ${x.new || "∅"}`).join("; ")}`}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
    );
  }

  return (
    <>
      <Header title="Hộp thư yêu cầu" description="Xử lý yêu cầu từ cổng trực tuyến và tiếp nhận trực tiếp: phân công, trả lời khách, lập hồ sơ khách hàng và báo giá" />
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {["", ...TARGET_UNITS.map(unitKey)].map((u) => (
            <Link key={u || "all"} href={qs({ unit: u })} className={cn("h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium", unit === u ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent")}>{u || "Mọi đơn vị"}</Link>
          ))}
          <div className="ml-auto w-full sm:w-72"><EntitySearchInput basePath="/request-inbox" placeholder="Tìm mã, tên, điện thoại, nội dung…" /></div>
        </div>
        <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card lg:grid-cols-[13rem_22rem_minmax(0,1fr)]">
          <nav aria-label="Hộp thư" className={cn("border-b p-2 lg:border-b-0 lg:border-r", selected && "hidden lg:block")}>
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {[...INBOX_BOXES, { key: "all" as const, label: "Tất cả", statuses: [] }].map((b) => {
                const n = b.key === "all" ? inUnit.length : inUnit.filter((r) => boxOf(r.status) === b.key).length;
                const late = b.key === "new" ? inUnit.filter((r) => r.status === "Mới tiếp nhận" && ageOf(r) >= SLA_DAYS).length : 0;
                return (
                  <li key={b.key}>
                    <Link href={qs({ box: b.key })} className={cn("flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm", box === b.key ? "bg-primary/10 font-semibold text-primary" : "hover:bg-accent")}>
                      {b.label}
                      <span className="ml-auto tabular-nums text-xs">{n}</span>
                      {late > 0 && <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white" title={`${late} yêu cầu quá ${SLA_DAYS} ngày chưa phản hồi`}>{late}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <ul className={cn("min-h-0 divide-y overflow-y-auto border-r scrollbar-thin", selected && "hidden lg:block")}>
            {list.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Không có yêu cầu</li>}
            {list.map((r) => {
              const age = ageOf(r);
              const late = r.status === "Mới tiếp nhận" && age >= SLA_DAYS;
              return (
                <li key={r.id}>
                  <Link href={qs({ id: r.id })} className={cn("flex gap-3 p-3 hover:bg-accent/60", selected?.id === r.id && "bg-primary/10", r.status === "Mới tiếp nhận" && "font-medium")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials(r.orgName || r.contactName)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm">{r.orgName || r.contactName}</span>
                        <span className={cn("ml-auto shrink-0 text-[11px] tabular-nums", late ? "font-semibold text-rose-600" : "text-muted-foreground")}>{ageText(age)}</span>
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">{r.kind} · {unitKey(r.targetUnit)}{r.handler && ` · ${r.handler}`}</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">{r.description}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className={cn("min-h-0 overflow-hidden", !selected && "hidden lg:flex lg:items-center lg:justify-center")}>
            {detail ?? <p className="p-6 text-sm text-muted-foreground">Chọn một yêu cầu để xem và xử lý</p>}
          </div>
        </div>
      </main>
    </>
  );
}
