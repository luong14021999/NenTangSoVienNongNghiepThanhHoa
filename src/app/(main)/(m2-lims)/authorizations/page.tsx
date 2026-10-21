import { Fragment } from "react";
import Link from "next/link";
import { UserCheck, FlaskConical, FileSignature, CalendarClock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import {
  AUTH_ROLES,
  AUTH_STATUSES,
  isActiveAuthorization,
  testAuthorizationStore,
  type TestAuthorization,
} from "@/lib/modules/m2/data/competence";
import { staffStore } from "@/lib/modules/m2/data/staff";
import { accreditedTests, testLabel, testLabels, testNoOf } from "@/lib/modules/m2/accreditation";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ủy quyền theo phép thử" };

const ROLE_SHORT: Record<TestAuthorization["role"], { code: string; className: string }> = {
  "Thực hiện phép thử": { code: "TH", className: "bg-emerald-100 text-emerald-800" },
  "Xem xét kết quả": { code: "XX", className: "bg-blue-100 text-blue-800" },
  "Phê duyệt & ký phiếu kết quả": { code: "PD", className: "bg-violet-100 text-violet-800" },
};

const MONITOR_WARN_DAYS = 30;

export default async function AuthorizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ gap?: string }>;
}) {
  const { gap = "" } = await searchParams;
  const [staff, auths] = await Promise.all([staffStore.list(), testAuthorizationStore.list()]);
  auths.sort((a, b) => testNoOf(a.testLabel) - testNoOf(b.testLabel) || a.staffName.localeCompare(b.staffName, "vi"));
  const people = staff.map((s) => s.fullName).sort((a, b) => a.localeCompare(b, "vi"));
  const active = auths.filter(isActiveAuthorization);

  const FIELDS: CrudField[] = [
    { name: "staffName", label: "Nhân viên", type: "select", options: people, required: true },
    { name: "role", label: "Vai trò được ủy quyền", type: "select", options: [...AUTH_ROLES] },
    { name: "testLabel", label: "Phép thử (danh mục VILAS 1501)", type: "select", options: testLabels, full: true, required: true },
    { name: "authorizedAt", label: "Ngày ủy quyền", type: "date", defaultValue: todayISO() },
    { name: "authorizedBy", label: "Người ủy quyền" },
    { name: "validUntil", label: "Hiệu lực đến", type: "date" },
    { name: "nextMonitorAt", label: "Theo dõi năng lực lần tới", type: "date" },
    { name: "status", label: "Trạng thái", type: "select", options: [...AUTH_STATUSES] },
    { name: "evidence", label: "Căn cứ năng lực (đào tạo, mẫu kiểm tra, kết quả PT…)", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const rolesOf = (no: number, person: string) =>
    active.filter((a) => testNoOf(a.testLabel) === no && a.staffName === person).map((a) => a.role);
  const testsWith = (role: TestAuthorization["role"]) =>
    new Set(active.filter((a) => a.role === role).map((a) => testNoOf(a.testLabel)));
  const performed = testsWith("Thực hiện phép thử");
  const approved = testsWith("Phê duyệt & ký phiếu kết quả");
  const monitorDue = active.filter((a) => daysUntil(a.nextMonitorAt) <= MONITOR_WARN_DAYS);

  const tests = accreditedTests.filter((t) => gap !== "1" || !performed.has(t.no));
  const matrices = [...new Set(tests.map((t) => t.matrix))];

  return (
    <>
      <Header
        title="Ủy quyền theo phép thử & theo dõi năng lực"
        description="ISO/IEC 17025:2017 §6.2 – ủy quyền thực hiện phép thử, xem xét và phê duyệt kết quả; theo dõi năng lực định kỳ"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Phép thử có người thực hiện", value: `${performed.size}/${accreditedTests.length}`, icon: FlaskConical, accent: performed.size < accreditedTests.length ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700" },
            { label: "Phép thử có người phê duyệt", value: `${approved.size}/${accreditedTests.length}`, icon: FileSignature, accent: "bg-violet-50 text-violet-600" },
            { label: "Ủy quyền hiệu lực", value: active.length, icon: UserCheck, accent: "bg-blue-50 text-blue-600" },
            { label: "Cần theo dõi năng lực", value: monitorDue.length, icon: CalendarClock, accent: "bg-amber-50 text-amber-600", hint: `quá hạn hoặc ≤ ${MONITOR_WARN_DAYS} ngày` },
          ]}
        />

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle>Ma trận ủy quyền</CardTitle>
              <CardDescription>
                <span className={`inline-block rounded px-1 font-mono text-[10px] ${ROLE_SHORT["Thực hiện phép thử"].className}`}>TH</span> thực hiện ·{" "}
                <span className={`inline-block rounded px-1 font-mono text-[10px] ${ROLE_SHORT["Xem xét kết quả"].className}`}>XX</span> xem xét kết quả ·{" "}
                <span className={`inline-block rounded px-1 font-mono text-[10px] ${ROLE_SHORT["Phê duyệt & ký phiếu kết quả"].className}`}>PD</span> phê duyệt & ký phiếu · dòng đỏ = chưa ai được ủy quyền thực hiện
              </CardDescription>
            </div>
            <div className="flex gap-1.5">
              <Link href="/authorizations" className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${gap !== "1" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                Tất cả {accreditedTests.length}
              </Link>
              <Link href="/authorizations?gap=1" className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${gap === "1" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                Chưa có người thực hiện {accreditedTests.length - performed.size}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 min-w-[280px] sticky left-0 bg-muted/90">Phép thử</th>
                    {people.map((p) => (
                      <th key={p} className="font-medium px-2 py-2 min-w-[84px] text-center">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrices.map((m) => renderGroup(m))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <CrudTableCard
          title="Quyết định ủy quyền"
          description="Mỗi dòng = 1 nhân viên × 1 phép thử × 1 vai trò; khi năng lực thay đổi, chuyển Tạm dừng / Hết hiệu lực"
          endpoint="/api/test-authorizations"
          entity="test-authorizations"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/test-authorizations"
              title="Thêm ủy quyền"
              fields={FIELDS}
              addLabel="Thêm ủy quyền"
            />
          }
          headers={["Nhân viên", "Phép thử", "Vai trò", "Ủy quyền / hiệu lực", "Theo dõi năng lực", "Trạng thái"]}
          emptyText="Chưa có quyết định ủy quyền nào"
          rows={auths.map((a) => {
            const days = daysUntil(a.nextMonitorAt);
            const due = isActiveAuthorization(a) && days <= MONITOR_WARN_DAYS;
            return {
              id: a.id,
              label: `${a.staffName} – ${a.testLabel.split(" · ")[0]}`,
              initial: a,
              cells: [
                <span key="n" className="text-sm font-medium whitespace-nowrap">{a.staffName}</span>,
                <span key="t" className="text-xs max-w-[340px] inline-block leading-snug">{a.testLabel}</span>,
                <span key="r" className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${ROLE_SHORT[a.role]?.className ?? ""}`}>{ROLE_SHORT[a.role]?.code ?? a.role}</span>,
                <div key="d" className="text-xs">
                  <div>{fmtDateVN(a.authorizedAt) || "—"}{a.authorizedBy && ` · ${a.authorizedBy}`}</div>
                  <div className="text-muted-foreground">{a.validUntil ? `đến ${fmtDateVN(a.validUntil)}` : "không thời hạn"}</div>
                </div>,
                <span key="m" className={`text-xs ${due ? "text-rose-600 font-medium" : ""}`}>
                  {fmtDateVN(a.nextMonitorAt) || "—"}
                  {due && (days < 0 ? ` · quá ${-days} ngày` : ` · còn ${days} ngày`)}
                </span>,
                <Badge key="s" variant={isActiveAuthorization(a) ? "success" : "secondary"}>
                  {a.status === "Hiệu lực" && !isActiveAuthorization(a) ? "Hết hạn" : a.status}
                </Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );

  function renderGroup(matrix: string) {
    return (
      <Fragment key={matrix}>
        <tr className="bg-muted/30">
          <td colSpan={people.length + 1} className="px-3 py-1.5 font-semibold text-foreground sticky left-0">
            {matrix}
          </td>
        </tr>
        {tests
          .filter((t) => t.matrix === matrix)
          .map((t) => {
            const gapRow = !performed.has(t.no);
            const label = testLabel(t);
            return (
              <tr key={t.no} className={`border-t ${gapRow ? "bg-rose-50/60" : ""}`}>
                <td className={`px-3 py-1.5 sticky left-0 ${gapRow ? "bg-rose-50" : "bg-card"}`} title={label}>
                  <span className="font-mono text-muted-foreground mr-1.5">#{t.no}</span>
                  {label.split(" · ").slice(2).join(" · ")}
                </td>
                {people.map((p) => (
                  <td key={p} className="px-2 py-1.5 text-center">
                    <div className="flex justify-center gap-0.5">
                      {rolesOf(t.no, p).map((r) => (
                        <span key={r} className={`rounded px-1 font-mono text-[10px] ${ROLE_SHORT[r]?.className ?? ""}`}>
                          {ROLE_SHORT[r]?.code}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
      </Fragment>
    );
  }
}
