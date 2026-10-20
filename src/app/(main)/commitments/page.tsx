import { Users, ShieldCheck, ShieldAlert, Scale } from "lucide-react";
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
import { StatGrid, clip } from "@/components/qms/stat-grid";
import {
  COMMITMENT_KINDS,
  commitmentCoverage,
  staffCommitmentStore,
  stillValid,
} from "@/lib/data/competence";
import { staffStore } from "@/lib/data/staff";
import { fmtDateVN, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cam kết khách quan & bảo mật" };

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
        ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
      }`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export default async function CommitmentsPage() {
  const [staff, commitments] = await Promise.all([
    staffStore.list(),
    staffCommitmentStore.list(),
  ]);
  commitments.sort((a, b) => (b.signedAt || "").localeCompare(a.signedAt || ""));
  const staffNames = staff.map((s) => s.fullName).sort((a, b) => a.localeCompare(b, "vi"));

  const FIELDS: CrudField[] = [
    { name: "staffName", label: "Nhân viên", type: "select", options: staffNames, required: true },
    { name: "kind", label: "Loại cam kết", type: "select", options: [...COMMITMENT_KINDS] },
    { name: "signedAt", label: "Ngày ký", type: "date", required: true, defaultValue: todayISO() },
    { name: "validUntil", label: "Hiệu lực đến (để trống = không thời hạn)", type: "date" },
    { name: "docRef", label: "Số / mã bản cam kết lưu hồ sơ", full: true, mono: true },
    { name: "conflictDeclared", label: "Khai báo xung đột lợi ích (nếu có)", type: "textarea", placeholder: "VD: người thân làm việc tại đơn vị khách hàng…" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const coverage = staff.map((s) => ({ s, ...commitmentCoverage(commitments, s.fullName) }));
  const complete = coverage.filter((c) => c.complete).length;
  const conflicts = commitments.filter((c) => c.conflictDeclared.trim() && stillValid(c.validUntil)).length;

  return (
    <>
      <Header
        title="Cam kết khách quan & bảo mật"
        description="ISO/IEC 17025:2017 §4.1 + §4.2 – cam kết của nhân viên, khai báo xung đột lợi ích có thể ảnh hưởng đến tính khách quan"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Nhân sự", value: staff.length, icon: Users, accent: "bg-blue-50 text-blue-600" },
            { label: "Đủ cam kết", value: complete, icon: ShieldCheck, accent: "bg-emerald-50 text-emerald-700", hint: "khách quan + bảo mật còn hiệu lực" },
            { label: "Còn thiếu", value: staff.length - complete, icon: ShieldAlert, accent: "bg-rose-50 text-rose-600" },
            { label: "Khai báo xung đột", value: conflicts, icon: Scale, accent: "bg-amber-50 text-amber-600", hint: "cần xem xét rủi ro khách quan" },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Tình trạng cam kết theo nhân viên</CardTitle>
            <CardDescription>Mỗi nhân viên cần cam kết khách quan và bảo mật còn hiệu lực</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border divide-y">
              {coverage.map(({ s, impartiality, confidentiality }) => {
                const last = commitments.find((c) => c.staffName === s.fullName);
                return (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {s.position} · {s.department}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Check ok={impartiality} label="Khách quan" />
                      <Check ok={confidentiality} label="Bảo mật" />
                      <span className="text-[11px] text-muted-foreground sm:w-32 sm:text-right">
                        {last?.signedAt ? `Ký ${fmtDateVN(last.signedAt)}` : "chưa ký"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <CrudTableCard
          title="Hồ sơ cam kết"
          description="Lưu từng lần ký; khi hết hạn hoặc thay đổi vị trí, ký lại và thêm bản ghi mới"
          endpoint="/api/staff-commitments"
          entity="staff-commitments"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/staff-commitments"
              title="Thêm bản cam kết"
              fields={FIELDS}
              addLabel="Thêm cam kết"
            />
          }
          headers={["Nhân viên", "Loại", "Ngày ký / hiệu lực", "Xung đột lợi ích", "Mã hồ sơ"]}
          emptyText="Chưa có bản cam kết nào"
          rows={commitments.map((c) => {
            const valid = stillValid(c.validUntil);
            return {
              id: c.id,
              label: `${c.staffName} – ${fmtDateVN(c.signedAt)}`,
              initial: c,
              cells: [
                <span key="n" className="text-sm font-medium">{c.staffName}</span>,
                <Badge key="k" variant="outline">{c.kind}</Badge>,
                <div key="d" className={`text-xs ${valid ? "" : "text-rose-600 font-medium"}`}>
                  <div>{fmtDateVN(c.signedAt)}</div>
                  <div className={valid ? "text-muted-foreground" : ""}>
                    {c.validUntil ? `đến ${fmtDateVN(c.validUntil)}${valid ? "" : " – hết hạn"}` : "không thời hạn"}
                  </div>
                </div>,
                <span key="c" className="text-xs max-w-[280px] inline-block">{c.conflictDeclared ? clip(c.conflictDeclared, 90) : "Không"}</span>,
                <span key="r" className="font-mono text-xs">{c.docRef || "—"}</span>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
