import Link from "next/link";
import { FlaskConical, BadgeCheck, FileWarning, CalendarClock } from "lucide-react";
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
import { StatGrid } from "@/components/qms/stat-grid";
import {
  VALIDATION_CONCLUSIONS,
  VALIDATION_KINDS,
  methodValidationStore,
  type MethodValidation,
} from "@/lib/data/competence";
import { accreditedTests, testLabels, testNoOf } from "@/lib/accreditation";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Xác nhận giá trị sử dụng phương pháp" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã báo cáo", required: true, mono: true, placeholder: "VD: XN-PP-2026-01" },
  { name: "conclusion", label: "Kết luận", type: "select", options: [...VALIDATION_CONCLUSIONS] },
  { name: "testLabel", label: "Phép thử (danh mục VILAS 1501)", type: "select", options: testLabels, full: true, required: true },
  { name: "kind", label: "Loại", type: "select", options: [...VALIDATION_KINDS], full: true },
  { name: "performedAt", label: "Ngày thực hiện", type: "date", defaultValue: todayISO() },
  { name: "performedBy", label: "Người thực hiện" },
  { name: "lod", label: "LOD" },
  { name: "loq", label: "LOQ" },
  { name: "linearity", label: "Khoảng tuyến tính / R²" },
  { name: "repeatability", label: "Độ lặp lại (RSDr %)" },
  { name: "reproducibility", label: "Độ tái lập nội bộ (RSDR %)" },
  { name: "recovery", label: "Độ thu hồi / độ đúng (%)" },
  { name: "uncertainty", label: "Độ không đảm bảo đo mở rộng" },
  { name: "approvedBy", label: "Người phê duyệt" },
  { name: "nextReviewAt", label: "Xem xét lại", type: "date" },
  { name: "note", label: "Ghi chú / thay đổi so với lần trước", type: "textarea" },
];

const conclusionVariant: Record<MethodValidation["conclusion"], "success" | "destructive" | "warning"> = {
  "Đạt": "success",
  "Không đạt": "destructive",
  "Đang thực hiện": "warning",
};

const isInHouse = (method: string) => method.startsWith("AEMD-");

export default async function MethodValidationsPage({
  searchParams,
}: {
  searchParams: Promise<{ gap?: string }>;
}) {
  const { gap = "" } = await searchParams;
  const records = (await methodValidationStore.list()).sort(
    (a, b) => (b.performedAt || "").localeCompare(a.performedAt || ""),
  );
  const latestOf = (no: number) => records.find((r) => testNoOf(r.testLabel) === no);
  const passedOf = (no: number) => records.find((r) => testNoOf(r.testLabel) === no && r.conclusion === "Đạt");

  const passed = accreditedTests.filter((t) => passedOf(t.no));
  const inHouseMissing = accreditedTests.filter((t) => isInHouse(t.method) && !passedOf(t.no));
  const reviewDue = records.filter((r) => r.conclusion === "Đạt" && daysUntil(r.nextReviewAt) < 0);
  const tests = accreditedTests.filter((t) => gap !== "1" || !passedOf(t.no));

  return (
    <>
      <Header
        title="Kiểm tra xác nhận & xác nhận giá trị sử dụng phương pháp"
        description="ISO/IEC 17025:2017 §7.2 – kiểm tra xác nhận phương pháp tiêu chuẩn; xác nhận giá trị sử dụng phương pháp do PTN xây dựng (AEMD-HD)"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Có hồ sơ Đạt", value: `${passed.length}/${accreditedTests.length}`, icon: BadgeCheck, accent: passed.length < accreditedTests.length ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700", hint: "phép thử được công nhận" },
            { label: "PP nội bộ thiếu hồ sơ", value: inHouseMissing.length, icon: FileWarning, accent: inHouseMissing.length ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700", hint: "AEMD-HD – bắt buộc xác nhận GTSD" },
            { label: "Đang thực hiện", value: records.filter((r) => r.conclusion === "Đang thực hiện").length, icon: FlaskConical, accent: "bg-blue-50 text-blue-600" },
            { label: "Quá hạn xem xét lại", value: reviewDue.length, icon: CalendarClock, accent: "bg-violet-50 text-violet-600" },
          ]}
        />

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle>Tình trạng theo phép thử</CardTitle>
              <CardDescription>So sánh LOQ đạt được trong hồ sơ xác nhận với LOQ công bố trong danh mục VILAS 1501</CardDescription>
            </div>
            <div className="flex gap-1.5">
              <Link href="/method-validations" className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${gap !== "1" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                Tất cả {accreditedTests.length}
              </Link>
              <Link href="/method-validations?gap=1" className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${gap === "1" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
                Chưa có hồ sơ Đạt {accreditedTests.length - passed.length}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium w-10">TT</th>
                    <th className="px-3 py-2 font-medium min-w-[260px]">Phép thử / phương pháp</th>
                    <th className="px-3 py-2 font-medium">LOQ công bố</th>
                    <th className="px-3 py-2 font-medium">Hồ sơ gần nhất</th>
                    <th className="px-3 py-2 font-medium">LOQ xác nhận</th>
                    <th className="px-3 py-2 font-medium">Kết luận</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tests.map((t) => {
                    const r = latestOf(t.no);
                    return (
                      <tr key={t.no} className={!r ? "bg-rose-50/40" : ""}>
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{t.no}</td>
                        <td className="px-3 py-1.5">
                          <div className="leading-snug">{t.matrix} · {t.name.split(":")[0].split(" – ")[0]}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {t.method.replace(/\s*\(Ref:.*\)$/, "")}
                            {isInHouse(t.method) && <span className="ml-1.5 text-rose-600 font-sans font-medium">PP nội bộ</span>}
                          </div>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{t.loq || "–"}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          {r ? <><span className="font-mono">{r.code}</span> · {fmtDateVN(r.performedAt)}</> : <span className="text-rose-600">chưa có</span>}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{r?.loq || "–"}</td>
                        <td className="px-3 py-1.5">
                          {r ? <Badge variant={conclusionVariant[r.conclusion] ?? "secondary"}>{r.conclusion}</Badge> : "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <CrudTableCard
          title="Hồ sơ xác nhận phương pháp"
          description="Thực hiện lại khi phương pháp, thiết bị, nhân sự hoặc phiên bản tiêu chuẩn thay đổi"
          endpoint="/api/method-validations"
          entity="method-validations"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/method-validations"
              title="Thêm hồ sơ xác nhận phương pháp"
              fields={FIELDS}
              addLabel="Thêm hồ sơ"
            />
          }
          headers={["Mã / ngày", "Phép thử", "Loại", "Thông số", "Kết luận"]}
          emptyText="Chưa có hồ sơ xác nhận phương pháp nào"
          rows={records.map((r) => ({
            id: r.id,
            label: r.code,
            initial: r,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{r.code}</div>
                <div className="text-[11px] text-muted-foreground">{fmtDateVN(r.performedAt)} · {r.performedBy || "—"}</div>
              </div>,
              <span key="t" className="text-xs max-w-[300px] inline-block leading-snug">{r.testLabel}</span>,
              <span key="k" className="text-xs max-w-[160px] inline-block">{r.kind}</span>,
              <div key="p" className="text-[11px] text-muted-foreground space-y-0.5">
                {[["LOD", r.lod], ["LOQ", r.loq], ["RSDr", r.repeatability], ["Thu hồi", r.recovery], ["U", r.uncertainty]]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>{k}: <span className="text-foreground">{v}</span></div>
                  ))}
              </div>,
              <Badge key="s" variant={conclusionVariant[r.conclusion] ?? "secondary"}>{r.conclusion}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
