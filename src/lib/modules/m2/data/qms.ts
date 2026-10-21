// Hồ sơ hệ thống quản lý theo ISO/IEC 17025:2017 (§7.10, §8.3, §8.7, §8.8, §8.9).
import { columnsMapping, createEntityStore } from "../../../platform/data/factory";

// ── §8.3 Kiểm soát tài liệu ─────────────────────────────────────────
export const DOC_TYPES = [
  "Sổ tay chất lượng",
  "Quy trình",
  "Hướng dẫn / SOP",
  "Biểu mẫu",
  "Tài liệu bên ngoài",
] as const;
export const DOC_STATUSES = ["Hiệu lực", "Dự thảo", "Hết hiệu lực"] as const;

export type QmsDocument = {
  id: string;
  code: string;
  title: string;
  docType: (typeof DOC_TYPES)[number];
  version: string;
  issuedAt: string;
  approvedBy: string;
  owner: string;
  reviewDue: string;
  status: (typeof DOC_STATUSES)[number];
  distribution: string;
  note: string;
};

export const qmsDocumentStore = createEntityStore<QmsDocument>(
  "qms-documents",
  [],
  columnsMapping<QmsDocument>("qms_documents", {
    code: "text",
    title: "text",
    docType: "text",
    version: "text",
    issuedAt: "date",
    approvedBy: "text",
    owner: "text",
    reviewDue: "date",
    status: "text",
    distribution: "text",
    note: "text",
  }),
);

// ── §7.10 Công việc không phù hợp + §8.7 Hành động khắc phục ─────────
export const NC_SOURCES = [
  "Công việc thử nghiệm",
  "Khiếu nại khách hàng",
  "Đánh giá nội bộ",
  "Đánh giá bên ngoài (BoA)",
  "Kiểm soát chất lượng (QC/PT)",
  "Thiết bị / hiệu chuẩn",
  "Xem xét của lãnh đạo",
  "Khác",
] as const;
export const NC_SEVERITIES = ["Nhẹ", "Nặng"] as const;
export const NC_STATUSES = [
  "Mở",
  "Đang xử lý",
  "Chờ đánh giá hiệu lực",
  "Đã đóng",
] as const;

export type Nonconformity = {
  id: string;
  code: string;
  detectedAt: string;
  source: (typeof NC_SOURCES)[number];
  refCode: string;
  clause: string;
  description: string;
  severity: (typeof NC_SEVERITIES)[number];
  impact: string;
  immediateAction: string;
  rootCause: string;
  correctiveAction: string;
  owner: string;
  dueAt: string;
  status: (typeof NC_STATUSES)[number];
  effectiveness: string;
  closedAt: string;
};

export const nonconformityStore = createEntityStore<Nonconformity>(
  "nonconformities",
  [],
  columnsMapping<Nonconformity>("nonconformities", {
    code: "text",
    detectedAt: "date",
    source: "text",
    refCode: "text",
    clause: "text",
    description: "text",
    severity: "text",
    impact: "text",
    immediateAction: "text",
    rootCause: "text",
    correctiveAction: "text",
    owner: "text",
    dueAt: "date",
    status: "text",
    effectiveness: "text",
    closedAt: "date",
  }),
);

export const isOpenNc = (n: Pick<Nonconformity, "status">) =>
  n.status !== "Đã đóng";

// ── §8.8 Đánh giá nội bộ ────────────────────────────────────────────
export const AUDIT_STATUSES = ["Kế hoạch", "Đang thực hiện", "Hoàn thành"] as const;

export type InternalAudit = {
  id: string;
  code: string;
  plannedAt: string;
  conductedAt: string;
  scope: string;
  criteria: string;
  auditors: string;
  auditees: string;
  status: (typeof AUDIT_STATUSES)[number];
  findingsSummary: string;
  reportedTo: string;
};

export const internalAuditStore = createEntityStore<InternalAudit>(
  "internal-audits",
  [],
  columnsMapping<InternalAudit>("internal_audits", {
    code: "text",
    plannedAt: "date",
    conductedAt: "date",
    scope: "text",
    criteria: "text",
    auditors: "text",
    auditees: "text",
    status: "text",
    findingsSummary: "text",
    reportedTo: "text",
  }),
);

// ── §8.9 Xem xét của lãnh đạo ───────────────────────────────────────
export const REVIEW_STATUSES = ["Kế hoạch", "Đã họp", "Đã hoàn tất hành động"] as const;

export type ManagementReview = {
  id: string;
  code: string;
  meetingAt: string;
  period: string;
  chair: string;
  participants: string;
  inputsNote: string;
  outputs: string;
  actions: string;
  status: (typeof REVIEW_STATUSES)[number];
};

export const managementReviewStore = createEntityStore<ManagementReview>(
  "management-reviews",
  [],
  columnsMapping<ManagementReview>("management_reviews", {
    code: "text",
    meetingAt: "date",
    period: "text",
    chair: "text",
    participants: "text",
    inputsNote: "text",
    outputs: "text",
    actions: "text",
    status: "text",
  }),
);

/** Ngày gần nhất (YYYY-MM-DD) trong danh sách, "" nếu không có. */
export const latestDate = (dates: string[]) =>
  dates.filter(Boolean).sort().at(-1) ?? "";
