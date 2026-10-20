import Link from "next/link";
import { SearchCheck, CalendarClock, OctagonAlert, CalendarCheck } from "lucide-react";
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
  AUDIT_STATUSES,
  internalAuditStore,
  isOpenNc,
  latestDate,
  nonconformityStore,
  type InternalAudit,
} from "@/lib/data/qms";
import { ISO_GROUPS, isoClauses } from "@/lib/iso17025";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đánh giá nội bộ" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã cuộc đánh giá", required: true, mono: true, placeholder: "VD: DGNB-2026-01" },
  { name: "status", label: "Trạng thái", type: "select", options: [...AUDIT_STATUSES] },
  { name: "plannedAt", label: "Ngày dự kiến", type: "date" },
  { name: "conductedAt", label: "Ngày thực hiện", type: "date" },
  { name: "scope", label: "Phạm vi / điều khoản đánh giá", type: "textarea", placeholder: "VD: §6.4, §7.7, §8.3 – Phòng AAS" },
  { name: "criteria", label: "Chuẩn mực đánh giá", full: true, defaultValue: "ISO/IEC 17025:2017; Sổ tay chất lượng; yêu cầu VILAS" },
  { name: "auditors", label: "Chuyên gia đánh giá (độc lập với khu vực được đánh giá)", full: true },
  { name: "auditees", label: "Bộ phận / người được đánh giá", full: true },
  { name: "findingsSummary", label: "Tóm tắt kết quả", type: "textarea" },
  { name: "reportedTo", label: "Đã báo cáo kết quả cho (§8.8.2 d)", full: true },
];

const statusVariant: Record<InternalAudit["status"], "default" | "warning" | "success"> = {
  "Kế hoạch": "default",
  "Đang thực hiện": "warning",
  "Hoàn thành": "success",
};

export default async function InternalAuditsPage() {
  const [audits, ncs] = await Promise.all([
    internalAuditStore.list(),
    nonconformityStore.list(),
  ]);
  audits.sort((a, b) =>
    (b.conductedAt || b.plannedAt || "").localeCompare(a.conductedAt || a.plannedAt || ""),
  );

  const findingsOf = (code: string) =>
    ncs.filter((n) => code && n.refCode.trim().toLowerCase() === code.trim().toLowerCase());
  const done = audits.filter((a) => a.status === "Hoàn thành");
  const lastDone = latestDate(done.map((a) => a.conductedAt));
  const daysSinceLast = lastDone ? -daysUntil(lastDone) : NaN;
  const nextPlanned = audits
    .filter((a) => a.status === "Kế hoạch" && a.plannedAt >= todayISO())
    .map((a) => a.plannedAt)
    .sort()[0];
  const openFindings = ncs.filter((n) => n.source === "Đánh giá nội bộ" && isOpenNc(n));

  return (
    <>
      <Header
        title="Đánh giá nội bộ"
        description="ISO/IEC 17025:2017 §8.8 – kế hoạch, thực hiện, báo cáo đánh giá nội bộ; phát hiện được xử lý ở sổ CAPA"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đã hoàn thành", value: done.length, icon: SearchCheck, accent: "bg-emerald-50 text-emerald-700", hint: "tổng số cuộc" },
            {
              label: "Lần gần nhất",
              value: lastDone ? fmtDateVN(lastDone) : "—",
              icon: CalendarCheck,
              accent: daysSinceLast > 365 || !lastDone ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600",
              hint: !lastDone ? "chưa có cuộc nào" : daysSinceLast > 365 ? "quá 12 tháng – cần đánh giá" : `${daysSinceLast} ngày trước`,
            },
            { label: "Kế hoạch sắp tới", value: nextPlanned ? fmtDateVN(nextPlanned) : "—", icon: CalendarClock, accent: "bg-amber-50 text-amber-600" },
            { label: "Phát hiện đang mở", value: openFindings.length, icon: OctagonAlert, accent: "bg-violet-50 text-violet-600", hint: "trong sổ CAPA" },
          ]}
        />

        <CrudTableCard
          title="Kế hoạch & kết quả đánh giá nội bộ"
          description="Mỗi phát hiện ghi ở sổ Không phù hợp & CAPA với Nguồn = Đánh giá nội bộ và Mã tham chiếu = mã cuộc đánh giá"
          endpoint="/api/internal-audits"
          entity="internal-audits"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/internal-audits"
              title="Lập kế hoạch đánh giá nội bộ"
              fields={FIELDS}
              addLabel="Thêm cuộc đánh giá"
            />
          }
          headers={["Mã / thời gian", "Phạm vi", "Chuyên gia / được đánh giá", "Phát hiện", "Trạng thái"]}
          emptyText="Chưa có cuộc đánh giá nội bộ nào"
          rows={audits.map((a) => {
            const f = findingsOf(a.code);
            const fOpen = f.filter(isOpenNc).length;
            return {
              id: a.id,
              label: a.code,
              initial: a,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{a.code}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.conductedAt ? `Thực hiện ${fmtDateVN(a.conductedAt)}` : a.plannedAt ? `Dự kiến ${fmtDateVN(a.plannedAt)}` : "—"}
                  </div>
                </div>,
                <div key="s" className="text-sm max-w-[320px] leading-snug">
                  {clip(a.scope || "—")}
                  {a.findingsSummary && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">KQ: {clip(a.findingsSummary, 90)}</div>
                  )}
                </div>,
                <div key="p" className="text-xs max-w-[200px]">
                  <div>{a.auditors || "—"}</div>
                  <div className="text-muted-foreground">{a.auditees}</div>
                </div>,
                f.length ? (
                  <Link
                    key="f"
                    href={`/nonconformities?q=${encodeURIComponent(a.code)}`}
                    className="text-xs text-primary hover:underline whitespace-nowrap"
                  >
                    {f.length} phát hiện{fOpen ? ` · ${fOpen} mở` : " · đã đóng"}
                  </Link>
                ) : (
                  <span key="f" className="text-xs text-muted-foreground">0</span>
                ),
                <Badge key="st" variant={statusVariant[a.status] ?? "secondary"}>{a.status}</Badge>,
              ],
            };
          })}
        />

        <Card>
          <CardHeader>
            <CardTitle>Checklist đánh giá theo điều khoản</CardTitle>
            <CardDescription>
              Gợi ý điểm cần kiểm tra cho từng điều khoản (tóm tắt diễn giải – đối chiếu nguyên văn TCVN ISO/IEC 17025:2017 khi đánh giá)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ISO_GROUPS.map((g) => (
              <details key={g} className="rounded-lg border group">
                <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-semibold flex items-center justify-between">
                  {g}
                  <span className="text-xs font-normal text-muted-foreground">
                    {isoClauses.filter((c) => c.group === g).length} điều khoản
                  </span>
                </summary>
                <div className="divide-y border-t">
                  {isoClauses
                    .filter((c) => c.group === g)
                    .map((c) => (
                      <div key={c.id} className="px-4 py-3 text-sm">
                        <div className="font-medium">
                          §{c.id} {c.title}
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {c.checks.map((k) => (
                            <li key={k} className="flex gap-2 text-muted-foreground">
                              <span className="mt-1.5 w-3 h-3 rounded-sm border shrink-0" />
                              {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
