import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, Copy, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { ActionButton } from "@/components/platform/action-button";
import {
  fieldTrialStore,
  labDataFor,
  provincialProjectStore,
  researchTaskStore,
  researcherStore,
  taskExpenseStore,
  taskMemberStore,
  taskMilestoneStore,
  taskSampleStore,
} from "@/lib/modules/m4/data/research";
import { EXPENSE_CATEGORIES, FUND_SOURCES, MEMBER_ROLES, budgetSummary, duplicateLevel, findDuplicates, milestoneProgress, taskAlerts } from "@/lib/modules/m4/research";
import { researchTaskFields, taskStatusVariant } from "@/lib/modules/m4/research-fields";
import { fmtVND } from "@/lib/modules/m4/finance";
import { channelMode } from "@/lib/platform/integration/lgsp";
import { ipAssetStore, knowledgeStore, techTransferStore } from "@/lib/modules/m4/data/knowledge";
import { currentAccess } from "@/lib/platform/data/access";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chi tiết nhiệm vụ KH&CN" };

export default async function ResearchTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tasks, researchers, members, milestones, expenses, samples, provincial, trials, access, knowledge, ipAssets, transfers] = await Promise.all([
    researchTaskStore.list(),
    researcherStore.list(),
    taskMemberStore.list(),
    taskMilestoneStore.list(),
    taskExpenseStore.list(),
    taskSampleStore.list(),
    provincialProjectStore.list(),
    fieldTrialStore.list(),
    currentAccess(),
    knowledgeStore.list(),
    ipAssetStore.list(),
    techTransferStore.list(),
  ]);
  const t = tasks.find((x) => x.id === id);
  if (!t) notFound();
  const today = todayISO();
  const researcherById = byId(researchers);
  const leader = researcherById.get(t.leaderId);
  const myMembers = members.filter((m) => m.taskId === id);
  const myMilestones = milestones.filter((m) => m.taskId === id).sort((a, b) => (a.dueAt || "9").localeCompare(b.dueAt || "9"));
  const myExpenses = expenses.filter((e) => e.taskId === id).sort((a, b) => (b.spentAt || "").localeCompare(a.spentAt || ""));
  const mySamples = samples.filter((s) => s.taskId === id);
  const myTrials = trials.filter((x) => x.taskId === id);
  const lab = await labDataFor(mySamples.map((s) => s.sampleCode));
  const labByCode = new Map(lab.map((l) => [l.code, l]));
  const p = milestoneProgress(myMilestones, today);
  const b = budgetSummary(t, myExpenses);
  const alerts = taskAlerts(t, myMilestones, myExpenses, today);
  const dupes = findDuplicates(t, [
    ...provincial.map((x) => ({ id: `p-${x.id}`, title: x.title, keywords: x.keywords, label: `${x.code} · ${x.hostOrg || "đơn vị khác"} · ${x.startYear || ""}–${x.endYear || ""}`, href: "/provincial-projects" })),
    ...tasks.map((x) => ({ id: x.id, title: x.title, keywords: x.keywords, label: `${x.code} · nhiệm vụ của Viện · ${x.status}`, href: `/research-tasks/${x.id}` })),
  ], { excludeId: id });
  const canWrite = access.can("write.research");
  const one = [{ value: t.id, label: t.code }];

  const memberFields: CrudField[] = [
    { name: "taskId", label: "Nhiệm vụ", type: "select", options: one, defaultValue: t.id },
    { name: "researcherId", label: "Người tham gia", type: "select", required: true, options: refOptions(researchers, (r) => `${r.code} · ${r.fullName}`) },
    { name: "role", label: "Vai trò", type: "select", options: [...MEMBER_ROLES] },
    { name: "workloadMonths", label: "Số tháng quy đổi", type: "number" },
    { name: "note", label: "Nội dung phụ trách", type: "textarea" },
  ];
  const milestoneFields: CrudField[] = [
    { name: "taskId", label: "Nhiệm vụ", type: "select", options: one, defaultValue: t.id },
    { name: "title", label: "Nội dung công việc / mốc", required: true, full: true },
    { name: "deliverable", label: "Sản phẩm", full: true },
    { name: "dueAt", label: "Hạn", type: "date" },
    { name: "doneAt", label: "Ngày hoàn thành", type: "date" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const expenseFields: CrudField[] = [
    { name: "taskId", label: "Nhiệm vụ", type: "select", options: one, defaultValue: t.id },
    { name: "spentAt", label: "Ngày chi", type: "date" },
    { name: "category", label: "Nội dung chi", type: "select", options: [...EXPENSE_CATEGORIES] },
    { name: "amount", label: "Số tiền (VND)", type: "number", required: true },
    { name: "source", label: "Nguồn", type: "select", options: [...FUND_SOURCES] },
    { name: "documentNo", label: "Số chứng từ", mono: true },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const sampleFields: CrudField[] = [
    { name: "taskId", label: "Nhiệm vụ", type: "select", options: one, defaultValue: t.id },
    { name: "sampleCode", label: "Mã mẫu (M2)", required: true, mono: true },
    { name: "purpose", label: "Mục đích phân tích", full: true },
  ];

  return (
    <>
      <Header title={t.code} description={t.title} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/research-tasks" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mr-auto">
            <ArrowLeft className="w-4 h-4" /> Danh sách nhiệm vụ
          </Link>
          {canWrite && <EntityFormDialog mode="edit" endpoint="/api/research-tasks" id={t.id} title={`Sửa ${t.code}`} fields={researchTaskFields(researchers)} initial={t} />}
          {canWrite && (
            <ActionButton
              url={`/api/research-tasks/${t.id}/publish`}
              label={`Gửi CSDL quốc gia${channelMode("NDXP") === "Mô phỏng" ? " (mô phỏng)" : ""}`}
              icon={<Send />}
              confirm="Gửi thông tin nhiệm vụ (tên, cấp, chủ nhiệm, kinh phí, trạng thái, kết quả) lên CSDL quốc gia về KH&CN qua NDXP?"
              success="Đã gửi – xem nhật ký ở trang Tích hợp (M1)"
            />
          )}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Thông tin <Badge variant={taskStatusVariant[t.status] ?? "secondary"}>{t.status}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Loại · cấp</dt><dd>{t.kind} · {t.level}</dd>
                <dt className="text-muted-foreground">Lĩnh vực</dt><dd>{t.field || "—"}</dd>
                <dt className="text-muted-foreground">Chủ nhiệm</dt><dd>{leader ? <Link href="/researchers" className="hover:underline">{`${leader.degree ? leader.degree + " " : ""}${leader.fullName}`}</Link> : "—"}</dd>
                <dt className="text-muted-foreground">Đơn vị chủ trì</dt><dd>{t.hostUnit || "—"}</dd>
                <dt className="text-muted-foreground">Thời gian</dt><dd>{fmtDateVN(t.startAt) || "—"} → {fmtDateVN(t.endAt) || "…"}</dd>
                <dt className="text-muted-foreground">Phê duyệt</dt><dd>{t.approvalNo ? `QĐ ${t.approvalNo} ngày ${fmtDateVN(t.approvedAt)}` : "—"}</dd>
                <dt className="text-muted-foreground">Nghiệm thu</dt><dd>{t.acceptanceResult ? `${t.acceptanceResult} · ${fmtDateVN(t.acceptedAt)}` : "—"}</dd>
                <dt className="text-muted-foreground">Từ khóa</dt><dd>{t.keywords || "—"}</dd>
                {t.nationalRef && (<><dt className="text-muted-foreground">Mã CSDL quốc gia</dt><dd className="font-mono">{t.nationalRef}</dd></>)}
              </dl>
              {t.objectives && <p className="text-sm mt-3 whitespace-pre-line"><span className="text-muted-foreground">Mục tiêu: </span>{t.objectives}</p>}
              {t.outputs && <p className="text-sm mt-2 whitespace-pre-line"><span className="text-muted-foreground">Sản phẩm: </span>{t.outputs}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tiến độ & kinh phí</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Mốc hoàn thành</span><span>{p.done}/{p.total} ({p.pct}%)</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${p.pct}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Giải ngân</span><span>{b.pct}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full ${b.pct > 100 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, b.pct)}%` }} /></div>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Được duyệt</span><span>{fmtVND(b.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Đã chi</span><span>{fmtVND(b.spent)}</span></div>
              <div className="flex justify-between font-medium"><span>Còn lại</span><span className={b.remaining < 0 ? "text-rose-600" : ""}>{fmtVND(b.remaining)}</span></div>
              {alerts.map((a) => (
                <div key={a.kind} className={`text-xs ${a.kind === "Sắp kết thúc" ? "text-amber-600" : "text-rose-600 font-medium"}`}>⚠ {a.kind} · {a.detail}</div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Copy className="w-4 h-4" />Kiểm tra trùng lặp</CardTitle>
            <CardDescription>So tên và từ khóa (bỏ dấu, bỏ từ chung chung) với danh mục đề tài trên địa bàn tỉnh và các nhiệm vụ khác của Viện</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {dupes.map(({ item, score }) => (
                <li key={item.id} className="py-2 flex flex-wrap items-start gap-x-3 gap-y-1">
                  <Badge variant={score >= 0.5 ? "destructive" : "warning"}>{duplicateLevel(score)} · {Math.round(score * 100)}%</Badge>
                  <span className="min-w-0 flex-1">
                    <Link href={item.href} className="hover:underline">{item.title}</Link>
                    <div className="text-[11px] text-muted-foreground">{item.label}</div>
                  </span>
                </li>
              ))}
              {dupes.length === 0 && <li className="py-3 text-muted-foreground text-sm">Không thấy nhiệm vụ tương tự (ngưỡng 30%)</li>}
            </ul>
          </CardContent>
        </Card>

        <CrudTableCard
          title="Tiến độ (mốc công việc)"
          description="Nhập ngày hoàn thành khi xong mốc; mốc quá hạn chưa xong được cảnh báo"
          endpoint="/api/task-milestones"
          entity="task-milestones"
          editFields={milestoneFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/task-milestones" title="Thêm mốc" fields={milestoneFields} addLabel="Thêm mốc" />}
          headers={["Nội dung", "Sản phẩm", "Hạn", "Hoàn thành"]}
          emptyText="Chưa có mốc tiến độ"
          rows={myMilestones.map((m) => {
            const late = !m.doneAt && m.dueAt && m.dueAt < today;
            return {
              id: m.id,
              label: m.title,
              initial: m,
              cells: [
                <span key="t" className="text-sm">{m.title}</span>,
                <span key="d" className="text-xs">{m.deliverable || "—"}</span>,
                <span key="h" className={`text-xs ${late ? "text-rose-600 font-medium" : ""}`}>{fmtDateVN(m.dueAt) || "—"}{late && " · trễ"}</span>,
                m.doneAt ? <Badge key="x" variant="success">{fmtDateVN(m.doneAt)}</Badge> : <span key="x" className="text-xs text-muted-foreground">chưa xong</span>,
              ],
            };
          })}
        />

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <CrudTableCard
            title="Thành viên"
            description="Lý lịch từng người ở trang Lý lịch khoa học"
            endpoint="/api/task-members"
            entity="task-members"
            editFields={memberFields}
            addNode={<EntityFormDialog mode="add" endpoint="/api/task-members" title="Thêm thành viên" fields={memberFields} addLabel="Thêm" />}
            headers={["Họ tên", "Vai trò", "Tháng quy đổi"]}
            emptyText="Chưa có thành viên"
            rows={myMembers.map((m) => {
              const r = researcherById.get(m.researcherId);
              return {
                id: m.id,
                label: r?.fullName ?? m.researcherId,
                initial: m,
                cells: [
                  <div key="n" className="text-sm">{r ? `${r.degree ? r.degree + " " : ""}${r.fullName}` : "—"}<div className="text-[11px] text-muted-foreground">{r?.specialty}</div></div>,
                  <span key="r" className="text-xs">{m.role}</span>,
                  <span key="w" className="text-xs">{m.workloadMonths || "—"}</span>,
                ],
              };
            })}
          />
          <CrudTableCard
            title="Giải ngân kinh phí"
            description={`Đã chi ${fmtVND(b.spent)} / ${fmtVND(b.total)}`}
            endpoint="/api/task-expenses"
            entity="task-expenses"
            editFields={expenseFields}
            addNode={<EntityFormDialog mode="add" endpoint="/api/task-expenses" title="Ghi nhận khoản chi" fields={expenseFields} addLabel="Thêm khoản chi" />}
            headers={["Ngày", "Nội dung", "Số tiền", "Chứng từ"]}
            emptyText="Chưa có khoản chi"
            rows={myExpenses.map((e) => ({
              id: e.id,
              label: `${e.category} ${e.documentNo}`,
              initial: e,
              cells: [
                <span key="d" className="text-xs whitespace-nowrap">{fmtDateVN(e.spentAt)}</span>,
                <div key="c" className="text-xs">{e.category}<div className="text-muted-foreground">{e.source}</div></div>,
                <span key="a" className="text-sm font-medium whitespace-nowrap">{fmtVND(e.amount)}</span>,
                <span key="n" className="text-xs font-mono">{e.documentNo || "—"}</span>,
              ],
            }))}
          />
        </section>

        <CrudTableCard
          title="Mẫu phân tích tại phòng thử nghiệm (M2)"
          description="Giá trị chỉ hiển thị khi kết quả đã được QA/QC và Trưởng phòng duyệt"
          endpoint="/api/task-samples"
          entity="task-samples"
          editFields={sampleFields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/task-samples" title="Gắn mẫu M2" fields={sampleFields} addLabel="Gắn mẫu" />}
          headers={["Mã mẫu", "Loại · trạng thái", "Kết quả đã duyệt", "Mục đích"]}
          emptyText="Chưa gắn mẫu nào"
          rows={mySamples.map((s) => {
            const l = labByCode.get(s.sampleCode);
            const approved = l?.lines.filter((x) => x.mean != null) ?? [];
            return {
              id: s.id,
              label: s.sampleCode,
              initial: s,
              cells: [
                <span key="c" className="font-mono text-xs font-semibold">{s.sampleCode}</span>,
                <div key="t" className="text-xs">{l?.type ?? "—"}<div className="text-muted-foreground">{l ? `${l.status} · nhận ${fmtDateVN(l.received_at)}` : "không đọc được"}</div></div>,
                <div key="r" className="text-xs">
                  {approved.slice(0, 6).map((x) => (
                    <div key={x.criterion}>{x.criterion}: <b>{Number(x.mean).toLocaleString("vi-VN")}</b> {x.unit}</div>
                  ))}
                  {l && <div className="text-muted-foreground">{l.approved}/{l.results} chỉ tiêu đã duyệt</div>}
                </div>,
                <span key="p" className="text-xs">{s.purpose || "—"}</span>,
              ],
            };
          })}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4" />Sản phẩm tri thức, tài sản trí tuệ, chuyển giao</CardTitle>
            <CardDescription>Tài liệu trong kho tri thức, văn bằng bảo hộ và hợp đồng chuyển giao gắn với nhiệm vụ này</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {knowledge.filter((k) => k.taskId === id).map((k) => (
                <li key={k.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <Link href={`/knowledge/${k.id}`} className="hover:underline"><span className="font-mono text-xs">{k.code}</span> {k.title}</Link>
                  <span className="text-xs text-muted-foreground">{k.kind}</span>
                </li>
              ))}
              {ipAssets.filter((a) => a.taskId === id).map((a) => (
                <li key={a.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <Link href={`/ip-assets?q=${encodeURIComponent(a.code)}`} className="hover:underline"><span className="font-mono text-xs">{a.code}</span> {a.title}</Link>
                  <span className="text-xs text-muted-foreground">{a.kind} · {a.status}</span>
                </li>
              ))}
              {transfers.filter((x) => x.taskId === id).map((x) => (
                <li key={x.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <Link href="/tech-transfers" className="hover:underline"><span className="font-mono text-xs">{x.code}</span> {x.title}</Link>
                  <span className="text-xs text-muted-foreground">Chuyển giao · {x.status}</span>
                </li>
              ))}
              {![...knowledge, ...ipAssets, ...transfers].some((x) => x.taskId === id) && <li className="py-2 text-muted-foreground">Chưa có – chọn nhiệm vụ này khi thêm tài liệu, văn bằng hoặc chuyển giao</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Thí nghiệm đồng ruộng</CardTitle><CardDescription>Quản lý ở trang Thí nghiệm đồng ruộng (chọn nhiệm vụ này)</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {myTrials.map((x) => (
                <li key={x.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <span><span className="font-mono text-xs">{x.code}</span> {x.title}</span>
                  <span className="text-xs text-muted-foreground">{x.crop} · {x.treatments} CT × {x.replications} lần nhắc · {x.status}</span>
                </li>
              ))}
              {myTrials.length === 0 && <li className="py-2 text-muted-foreground text-sm"><Link href="/field-trials" className="text-primary hover:underline">Thêm thí nghiệm</Link></li>}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
