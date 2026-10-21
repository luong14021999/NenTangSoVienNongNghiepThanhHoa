import Link from "next/link";
import { ClipboardList, Hourglass, CheckCircle2, AlarmClock } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import type { CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { AssignDialog } from "@/components/m2/assignments/assign-dialog";
import { ASSIGNMENT_STATUSES, assignmentStore } from "@/lib/modules/m2/data/custody";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { isActiveAuthorization, testAuthorizationStore } from "@/lib/modules/m2/data/competence";
import { testLabels, testNoOf } from "@/lib/modules/m2/accreditation";
import { daysUntil, fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phân công công việc" };

const EDIT_FIELDS: CrudField[] = [
  { name: "status", label: "Trạng thái", type: "select", options: [...ASSIGNMENT_STATUSES] },
  { name: "dueAt", label: "Hạn hoàn thành", type: "date" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const statusVariant = { "Đã giao": "default", "Đang làm": "warning", "Hoàn thành": "success", "Hủy": "secondary" } as const;

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string; status?: string; who?: string }>;
}) {
  const { sample = "", status = "", who = "" } = await searchParams;
  const [assigns, samples, auths] = await Promise.all([assignmentStore.list(), samplesStore.list(), testAuthorizationStore.list()]);
  const isOpen = (a: { status: string }) => a.status === "Đã giao" || a.status === "Đang làm";
  const late = (a: { status: string; dueAt: string }) => isOpen(a) && daysUntil(a.dueAt) < 0;

  const eligibleByTest: Record<number, string[]> = {};
  for (const a of auths.filter((x) => isActiveAuthorization(x) && x.role === "Thực hiện phép thử")) {
    const no = testNoOf(a.testLabel);
    eligibleByTest[no] = [...new Set([...(eligibleByTest[no] ?? []), a.staffName])];
  }
  const people = [...new Set(assigns.map((a) => a.assignee))].sort((a, b) => a.localeCompare(b, "vi"));
  const workload = Object.fromEntries(
    people.map((p) => [p, { open: assigns.filter((a) => a.assignee === p && isOpen(a)).length, overdue: assigns.filter((a) => a.assignee === p && late(a)).length }]),
  );
  const rows = assigns
    .filter((a) => (!sample || a.sampleCode === sample) && (!who || a.assignee === who) && (!status || (status === "late" ? late(a) : status === "open" ? isOpen(a) : a.status === status)))
    .sort((a, b) => (a.dueAt || "9").localeCompare(b.dueAt || "9"));
  const chip = (key: string, label: string, n: number) => (
    <Link
      key={key || "all"}
      href={`/assignments?${new URLSearchParams({ ...(sample && { sample }), ...(who && { who }), ...(key && { status: key }) })}`}
      className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${status === key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
    >
      {label} <span className="ml-1.5 opacity-70">{n}</span>
    </Link>
  );

  return (
    <>
      <Header
        title="Phân công công việc theo năng lực"
        description="M2.2 · ISO/IEC 17025:2017 §6.2.6 – giao chỉ tiêu cho KTV được ủy quyền, theo dõi tiến độ và thời hạn; trạng thái tự cập nhật theo kết quả"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đang mở", value: assigns.filter(isOpen).length, icon: ClipboardList, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang làm", value: assigns.filter((a) => a.status === "Đang làm").length, icon: Hourglass, accent: "bg-amber-50 text-amber-600" },
            { label: "Quá hạn", value: assigns.filter(late).length, icon: AlarmClock, accent: "bg-rose-50 text-rose-600" },
            { label: "Hoàn thành", value: assigns.filter((a) => a.status === "Hoàn thành").length, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
          ]}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Khối lượng công việc theo KTV</CardTitle>
            <CardDescription>Bấm tên để lọc</CardDescription>
          </CardHeader>
          <CardContent>
            {people.length === 0 && <div className="text-sm text-muted-foreground">Chưa có phân công nào</div>}
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <Link key={p} href={who === p ? "/assignments" : `/assignments?who=${encodeURIComponent(p)}`} className={`rounded-lg border px-3 py-2 text-xs ${who === p ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                  <div className="font-medium text-sm">{p}</div>
                  <div className="text-muted-foreground">đang mở {workload[p].open}{workload[p].overdue ? <span className="text-rose-600"> · quá hạn {workload[p].overdue}</span> : ""}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          {chip("", "Tất cả", assigns.length)}
          {chip("open", "Đang mở", assigns.filter(isOpen).length)}
          {chip("late", "Quá hạn", assigns.filter(late).length)}
          {ASSIGNMENT_STATUSES.map((s) => chip(s, s, assigns.filter((a) => a.status === s).length))}
          {sample && <Badge variant="outline">Mẫu {sample} · <Link href="/assignments" className="ml-1 underline">bỏ lọc</Link></Badge>}
          <div className="ml-auto">
            <AssignDialog
              samples={samples.map((s) => ({ value: s.code, label: `${s.code} · ${s.customer}` }))}
              tests={testLabels}
              eligibleByTest={eligibleByTest}
              workload={workload}
              defaultSample={sample}
            />
          </div>
        </div>

        <CrudTableCard
          title="Danh sách phân công"
          description="KTV nhập kết quả → Đang làm; Trưởng phòng phê duyệt → Hoàn thành (tự động)"
          endpoint="/api/assignments"
          entity="assignments"
          editFields={EDIT_FIELDS}
          addNode={null}
          headers={["Mẫu", "Phép thử", "KTV", "Hạn", "Phân công bởi", "Trạng thái"]}
          emptyText="Không có phân công phù hợp"
          rows={rows.map((a) => {
            const d = daysUntil(a.dueAt);
            return {
              id: a.id,
              label: `${a.sampleCode} – ${a.assignee}`,
              initial: a,
              cells: [
                <Link key="s" href={`/samples/${encodeURIComponent(a.sampleCode)}`} className="font-mono text-xs text-primary hover:underline">{a.sampleCode}</Link>,
                <span key="t" className="text-xs max-w-[320px] inline-block">{clip(a.testLabel, 90)}</span>,
                <span key="a" className="text-sm whitespace-nowrap">{a.assignee}</span>,
                <span key="d" className={`text-xs whitespace-nowrap ${late(a) ? "text-rose-600 font-medium" : ""}`}>
                  {fmtDateVN(a.dueAt) || "—"}{late(a) && ` · quá ${-d} ngày`}
                </span>,
                <span key="b" className="text-xs">{a.assignedBy}</span>,
                <Badge key="st" variant={statusVariant[a.status] ?? "secondary"}>{a.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
