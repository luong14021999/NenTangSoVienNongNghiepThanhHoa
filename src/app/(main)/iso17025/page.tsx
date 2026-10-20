import Link from "next/link";
import { CheckCircle2, AlertTriangle, Database, CircleDashed } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatGrid } from "@/components/qms/stat-grid";
import { ISO_GROUPS, isoClauses } from "@/lib/iso17025";
import {
  internalAuditStore,
  isOpenNc,
  latestDate,
  managementReviewStore,
  nonconformityStore,
  qmsDocumentStore,
} from "@/lib/data/qms";
import { staffStore } from "@/lib/data/staff";
import { environmentStore } from "@/lib/data/environment";
import { equipmentStore } from "@/lib/data/equipment";
import { calibrationLogStore } from "@/lib/data/calibration-logs";
import { chemicalsStore } from "@/lib/data/chemicals";
import { testRequestsStore } from "@/lib/data/test-requests";
import { samplesStore } from "@/lib/data/samples";
import { archivedSamplesStore } from "@/lib/data/archived-samples";
import { feedbackStore } from "@/lib/data/feedback";
import { accreditedTests } from "@/lib/accreditation";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/dates";
import { isAuthConfigured } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tổng quan ISO/IEC 17025" };

type Status = "ok" | "records" | "sample" | "missing";

const STATUS: Record<Status, { label: string; className: string }> = {
  ok: { label: "Đáp ứng", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  records: { label: "Cần bổ sung hồ sơ", className: "bg-amber-50 text-amber-700 border-amber-200" },
  sample: { label: "Chưa lưu hồ sơ", className: "bg-orange-50 text-orange-700 border-orange-200" },
  missing: { label: "Chưa có module", className: "bg-muted text-muted-foreground border-border" },
};

type Assessment = {
  status: Status;
  evidence: string;
  modules: { href: string; label: string }[];
  plan?: string;
};

export default async function IsoOverviewPage() {
  const [docs, ncs, audits, reviews, staff, env, equipment, calibrations, chemicals, requests, samples, archived, feedback] =
    await Promise.all([
      qmsDocumentStore.list(),
      nonconformityStore.list(),
      internalAuditStore.list(),
      managementReviewStore.list(),
      staffStore.list(),
      environmentStore.list(),
      equipmentStore.list(),
      calibrationLogStore.list(),
      chemicalsStore.list(),
      testRequestsStore.list(),
      samplesStore.list(),
      archivedSamplesStore.list(),
      feedbackStore.list(),
    ]);

  const today = todayISO();
  const yearAgo = String(Number(today.slice(0, 4)) - 1) + today.slice(4);
  const lastAudit = latestDate(audits.filter((a) => a.status === "Hoàn thành").map((a) => a.conductedAt));
  const lastReview = latestDate(reviews.filter((r) => r.status !== "Kế hoạch").map((r) => r.meetingAt));
  const overdueCal = equipment.filter((e) => daysUntil(e.nextCalibration) < 0).length;
  const noCalDate = equipment.filter((e) => !e.nextCalibration).length;
  const crm = chemicals.filter((c) => c.isReference).length;
  const activeDocs = docs.filter((d) => d.status === "Hiệu lực");
  const manual = docs.some((d) => d.docType === "Sổ tay chất lượng" && d.status === "Hiệu lực");
  const docsOverdue = activeDocs.filter((d) => daysUntil(d.reviewDue) < 0).length;
  const complaints = feedback.filter((f) => f.isComplaint).length;
  const openNc = ncs.filter(isOpenNc).length;

  const has = (n: number, ok: string, none: string) => (n > 0 ? ok : none);
  const A: Record<string, Assessment> = {
    "4.1": { status: "sample", evidence: "Rủi ro về tính khách quan có trong sổ rủi ro (dữ liệu mẫu); chưa có cam kết của nhân viên", modules: [{ href: "/risks", label: "Đăng ký rủi ro" }], plan: "Đợt 2–3" },
    "4.2": { status: "missing", evidence: "Chưa có hồ sơ cam kết bảo mật của nhân viên", modules: [], plan: "Đợt 2" },
    "5": { status: "ok", evidence: `Phạm vi hoạt động: ${accreditedTests.length} phép thử VILAS 1501; sơ đồ tổ chức trong Nhân sự`, modules: [{ href: "/accreditation", label: "Phạm vi công nhận" }, { href: "/personnel", label: "Nhân sự" }] },
    "6.2": { status: "records", evidence: `${staff.length} nhân sự có hồ sơ năng lực, đào tạo; chưa có ủy quyền theo từng phép thử`, modules: [{ href: "/personnel", label: "Nhân sự" }], plan: "Ủy quyền: Đợt 2" },
    "6.3": { status: env.length ? "ok" : "records", evidence: has(env.length, `${env.length} lần ghi điều kiện môi trường`, "Chưa có bản ghi điều kiện môi trường"), modules: [{ href: "/environment", label: "Theo dõi môi trường" }] },
    "6.4": {
      status: overdueCal || noCalDate ? "records" : "ok",
      evidence: `${equipment.length} thiết bị · ${overdueCal} quá hạn hiệu chuẩn · ${noCalDate} chưa nhập lịch hiệu chuẩn`,
      modules: [{ href: "/equipment", label: "Thiết bị" }],
    },
    "6.5": { status: calibrations.length && crm ? "ok" : "records", evidence: `${calibrations.length} hồ sơ hiệu chuẩn · ${crm} chất chuẩn / CRM trong danh mục`, modules: [{ href: "/equipment", label: "Hiệu chuẩn thiết bị" }, { href: "/chemicals", label: "Chất chuẩn" }] },
    "6.6": { status: "missing", evidence: "Chưa có danh sách và hồ sơ đánh giá nhà cung cấp", modules: [], plan: "Đợt 2" },
    "7.1": { status: requests.length ? "ok" : "records", evidence: has(requests.length, `${requests.length} phiếu yêu cầu / hợp đồng`, "Chưa có phiếu yêu cầu"), modules: [{ href: "/test-requests", label: "Phiếu yêu cầu thử nghiệm" }] },
    "7.2": { status: "records", evidence: `Danh mục ${accreditedTests.length} phương pháp được công nhận; chưa có hồ sơ kiểm tra xác nhận / xác nhận giá trị sử dụng`, modules: [{ href: "/accreditation", label: "Phạm vi công nhận" }], plan: "Hồ sơ xác nhận: Đợt 2" },
    "7.3": { status: "sample", evidence: "Có giao diện lấy mẫu hiện trường, quan trắc theo đợt nhưng dữ liệu chưa lưu database", modules: [{ href: "/field", label: "Lấy mẫu hiện trường" }, { href: "/campaigns", label: "Quan trắc theo đợt" }] },
    "7.4": { status: samples.length ? "ok" : "records", evidence: `${samples.length} mẫu tiếp nhận · ${archived.length} mẫu lưu`, modules: [{ href: "/samples", label: "Tiếp nhận mẫu" }, { href: "/archive", label: "Sổ mẫu lưu" }] },
    "7.5": { status: "sample", evidence: "Phiếu diễn biến phân tích có lưu vết sửa đổi nhưng đang dùng dữ liệu mẫu", modules: [{ href: "/result-entry", label: "Nhập kết quả & duyệt" }, { href: "/analysis", label: "Quy trình phân tích" }], plan: "Đợt 3" },
    "7.6": { status: "sample", evidence: "Độ không đảm bảo đo nằm trong quy tắc quyết định và kết quả phân tích (dữ liệu mẫu)", modules: [{ href: "/decision-rules", label: "Quy tắc quyết định" }], plan: "Đợt 3" },
    "7.7": { status: "sample", evidence: "Biểu đồ Levey-Jennings, Westgard, PT/so sánh liên phòng (dữ liệu mẫu)", modules: [{ href: "/qc", label: "QC Levey-Jennings" }], plan: "Đợt 3" },
    "7.8": { status: "sample", evidence: "Trang phiếu kết quả chưa đủ nội dung bắt buộc §7.8.2", modules: [{ href: "/reports", label: "Phiếu kết quả" }], plan: "Đợt 3" },
    "7.9": { status: "ok", evidence: `${feedback.length} phiếu ý kiến · ${complaints} khiếu nại được theo dõi`, modules: [{ href: "/feedback", label: "Ý kiến & khiếu nại" }] },
    "7.10": { status: "ok", evidence: `${ncs.length} công việc không phù hợp đã ghi nhận · ${openNc} đang mở`, modules: [{ href: "/nonconformities", label: "Không phù hợp & CAPA" }] },
    "7.11": { status: isAuthConfigured() ? "records" : "missing", evidence: isAuthConfigured() ? "Bắt buộc đăng nhập cho trang và API; database Neon có sao lưu; chưa phân quyền theo vai trò" : "Chưa bật đăng nhập", modules: [{ href: "/settings", label: "Cấu hình" }], plan: "Phân quyền vai trò: Đợt 4" },
    "8.2": { status: manual ? "ok" : "records", evidence: manual ? "Có Sổ tay chất lượng hiệu lực" : "Chưa đăng ký Sổ tay chất lượng trong danh mục tài liệu", modules: [{ href: "/documents?type=S%E1%BB%95+tay+ch%E1%BA%A5t+l%C6%B0%E1%BB%A3ng", label: "Kiểm soát tài liệu" }] },
    "8.3": { status: docs.length && !docsOverdue ? "ok" : "records", evidence: `${activeDocs.length} tài liệu hiệu lực · ${docsOverdue} quá hạn soát xét`, modules: [{ href: "/documents", label: "Kiểm soát tài liệu" }] },
    "8.4": { status: "records", evidence: "Hồ sơ lưu trên database Neon (Singapore); một số module còn dùng dữ liệu mẫu", modules: [], plan: "Đợt 3" },
    "8.5": { status: "sample", evidence: "Sổ đăng ký rủi ro & cơ hội đang dùng dữ liệu mẫu", modules: [{ href: "/risks", label: "Đăng ký rủi ro" }], plan: "Đợt 3" },
    "8.6": { status: feedback.length ? "ok" : "records", evidence: `${feedback.length} phiếu ý kiến khách hàng · cải tiến theo dõi qua CAPA`, modules: [{ href: "/feedback", label: "Ý kiến khách hàng" }, { href: "/nonconformities", label: "CAPA" }] },
    "8.7": { status: ncs.length ? "ok" : "records", evidence: `${ncs.filter((n) => n.status === "Đã đóng").length} hành động khắc phục đã đóng · ${openNc} đang mở`, modules: [{ href: "/nonconformities", label: "Không phù hợp & CAPA" }] },
    "8.8": {
      status: lastAudit && lastAudit >= yearAgo ? "ok" : "records",
      evidence: lastAudit ? `Đánh giá nội bộ gần nhất ${fmtDateVN(lastAudit)}${lastAudit < yearAgo ? " – quá 12 tháng" : ""}` : "Chưa có cuộc đánh giá nội bộ nào",
      modules: [{ href: "/internal-audits", label: "Đánh giá nội bộ" }],
    },
    "8.9": {
      status: lastReview && lastReview >= yearAgo ? "ok" : "records",
      evidence: lastReview ? `Xem xét lãnh đạo gần nhất ${fmtDateVN(lastReview)}${lastReview < yearAgo ? " – quá 12 tháng" : ""}` : "Chưa có cuộc xem xét của lãnh đạo nào",
      modules: [{ href: "/management-reviews", label: "Xem xét lãnh đạo" }],
    },
  };

  const count = (s: Status) => isoClauses.filter((c) => A[c.id]?.status === s).length;

  return (
    <>
      <Header
        title="Tổng quan ISO/IEC 17025:2017"
        description="Mức độ đáp ứng từng điều khoản dựa trên module và hồ sơ đang có trong phần mềm – cập nhật theo dữ liệu thực"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đáp ứng", value: count("ok"), icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700", hint: `/${isoClauses.length} điều khoản` },
            { label: "Cần bổ sung hồ sơ", value: count("records"), icon: AlertTriangle, accent: "bg-amber-50 text-amber-600", hint: "có module, thiếu dữ liệu" },
            { label: "Chưa lưu hồ sơ", value: count("sample"), icon: Database, accent: "bg-orange-50 text-orange-600", hint: "giao diện dùng dữ liệu mẫu" },
            { label: "Chưa có module", value: count("missing"), icon: CircleDashed, accent: "bg-muted text-muted-foreground" },
          ]}
        />

        {ISO_GROUPS.map((g) => (
          <Card key={g}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{g}</CardTitle>
              <CardDescription>Đánh giá tự động – chỉ phản ánh dữ liệu trong phần mềm, không thay cho đánh giá nội bộ</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {isoClauses
                  .filter((c) => c.group === g)
                  .map((c) => {
                    const a = A[c.id];
                    const s = STATUS[a.status];
                    return (
                      <div key={c.id} className="px-5 py-3.5 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-2 lg:gap-6 lg:items-center">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">
                            <span className="font-mono text-muted-foreground mr-1.5">§{c.id}</span>
                            {c.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{c.summary}</div>
                        </div>
                        <div className="text-xs leading-snug">
                          <div>{a.evidence}</div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            {a.modules.map((m) => (
                              <Link key={m.href} href={m.href} className="text-primary hover:underline">
                                {m.label} →
                              </Link>
                            ))}
                            {a.plan && <span className="text-muted-foreground">Kế hoạch: {a.plan}</span>}
                          </div>
                        </div>
                        <Badge variant="outline" className={`justify-self-start lg:justify-self-end whitespace-nowrap ${s.className}`}>
                          {s.label}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </>
  );
}
