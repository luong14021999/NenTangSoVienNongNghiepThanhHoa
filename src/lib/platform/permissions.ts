// Phân quyền theo vai trò (ISO/IEC 17025:2017 §7.11.3, §6.2.6): hàm thuần, kiểm thử được.
// Nguyên tắc tách nhiệm vụ: người nhập ≠ người duyệt ≠ người phê duyệt; Quản trị hệ thống không duyệt kết quả.

// "Dịch vụ – Kế toán", "Quản lý khoa học" (M4), "Nuôi cấy mô" (M3.1), "Giống" (M3.2): vai trò riêng của từng phân hệ.
// "Lãnh đạo Viện": xem bảng điều hành; "Quản lý danh mục": đầu mối danh mục dùng chung của từng phòng (M1.2).
export const ROLES = ["Quản trị", "Lãnh đạo Viện", "Trưởng phòng", "QA/QC", "KTV", "Tiếp nhận mẫu", "Dịch vụ – Kế toán", "Quản lý khoa học", "Nuôi cấy mô", "Giống", "Quản lý danh mục", "Chỉ xem"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  "admin.users": { label: "Quản lý tài khoản & phân quyền", roles: ["Quản trị"] },
  "admin.system": { label: "Cấu hình hệ thống, khóa API, tích hợp LGSP/NDXP, sao lưu", roles: ["Quản trị"] },
  "admin.view": { label: "Vào khu Quản trị hệ thống (bảng quản trị, bảo mật, tích hợp, giám sát, nhật ký, cấu hình)", roles: ["Quản trị"] },
  "view.executive": { label: "Xem bảng điều hành, phân tích – dự báo, kho dữ liệu tổng hợp", roles: ["Lãnh đạo Viện", "Trưởng phòng", "Quản trị"] },
  "write.mdm": { label: "Danh mục dùng chung (MDM)", roles: ["Quản trị", "Quản lý danh mục", "QA/QC", "Trưởng phòng"] },
  "results.enter": { label: "Nhập / sửa / nộp kết quả phân tích", roles: ["KTV", "Trưởng phòng"] },
  "results.qa": { label: "QA/QC duyệt hoặc trả lại kết quả", roles: ["QA/QC", "Trưởng phòng"] },
  "results.approve": { label: "Phê duyệt kết quả (ký điện tử)", roles: ["Trưởng phòng"] },
  "reports.issue": { label: "Phát hành phiếu kết quả (ký điện tử)", roles: ["Trưởng phòng", "QA/QC"] },
  "reports.revoke": { label: "Thu hồi phiếu kết quả (ký điện tử)", roles: ["Trưởng phòng"] },
  "rules.draft": { label: "Soạn quy tắc kiểm soát phát hành", roles: ["QA/QC", "Trưởng phòng"] },
  "work.assign": { label: "Phân công chỉ tiêu cho KTV", roles: ["Trưởng phòng", "QA/QC"] },
  "rules.approve": { label: "Phê duyệt quy tắc kiểm soát phát hành", roles: ["Trưởng phòng"] },
  "write.personnel": { label: "Nhân sự, ủy quyền phép thử, cam kết", roles: ["Trưởng phòng", "Quản trị"] },
  "write.quality": { label: "Tài liệu, đánh giá nội bộ, xem xét lãnh đạo, rủi ro, quy tắc quyết định, nhà cung cấp, xác nhận PP", roles: ["QA/QC", "Trưởng phòng", "Quản trị"] },
  "write.lab": { label: "Thiết bị, hóa chất, dụng cụ, QC, môi trường, nhật ký", roles: ["KTV", "QA/QC", "Trưởng phòng", "Quản trị"] },
  "write.reception": { label: "Khách hàng, phiếu yêu cầu, tiếp nhận mẫu, mẫu lưu, ý kiến KH", roles: ["Tiếp nhận mẫu", "KTV", "QA/QC", "Trưởng phòng", "Quản trị"] },
  "write.requests": { label: "M4.1: xử lý yêu cầu dịch vụ từ cổng trực tuyến / trực tiếp", roles: ["Tiếp nhận mẫu", "Dịch vụ – Kế toán", "Nuôi cấy mô", "Giống", "Trưởng phòng", "Quản trị"] },
  "write.services": { label: "M4: bảng giá, nội dung cổng công khai, báo giá, hợp đồng, thanh toán", roles: ["Dịch vụ – Kế toán", "Trưởng phòng", "Quản trị"] },
  "write.research": { label: "M4.4–M4.6: nhiệm vụ KH&CN, lý lịch khoa học, thí nghiệm, kho tri thức, dữ liệu nền, tài sản trí tuệ, hợp tác, chuyển giao, tập huấn", roles: ["Quản lý khoa học", "Trưởng phòng", "Quản trị"] },
  "services.approve": { label: "M4: phê duyệt báo giá", roles: ["Trưởng phòng", "Quản trị"] },
  "write.tissue": { label: "M3.1: vật liệu, công thức môi trường, mẻ cấy, lô cây giống", roles: ["Nuôi cấy mô", "Trưởng phòng", "Quản trị"] },
  "write.breeding": { label: "M3.2: lý lịch giống, nguồn gen, khảo nghiệm", roles: ["Giống", "Trưởng phòng", "Quản trị"] },
  "write.any": { label: "Ghi nhận sự không phù hợp, sự cố hệ thống", roles: ["Tiếp nhận mẫu", "KTV", "QA/QC", "Trưởng phòng", "Quản trị"] },
} as const satisfies Record<string, { label: string; roles: readonly Role[] }>;
export type Permission = keyof typeof PERMISSIONS;

/** Quyền ghi theo collection (API CRUD chung). Collection không liệt kê → write.lab. */
const ENTITY_PERMISSION: Record<string, Permission> = {
  staff: "write.personnel",
  "test-authorizations": "write.personnel",
  "staff-commitments": "write.personnel",
  "qms-documents": "write.quality",
  "internal-audits": "write.quality",
  "management-reviews": "write.quality",
  risks: "write.quality",
  opportunities: "write.quality",
  "decision-rules": "write.quality",
  suppliers: "write.quality",
  "method-validations": "write.quality",
  customers: "write.reception",
  samples: "write.reception",
  "test-requests": "write.reception",
  "archived-samples": "write.reception",
  feedback: "write.reception",
  "calc-templates": "write.quality",
  "uncertainty-budgets": "write.quality",
  "sample-events": "write.reception",
  assignments: "work.assign",
  "mdm-items": "write.mdm",
  "api-clients": "admin.system",
  nonconformities: "write.any",
  "system-incidents": "write.any",
  "service-requests": "write.requests",
  "price-items": "write.services",
  "public-resources": "write.services",
  quotations: "write.services",
  "quotation-lines": "write.services",
  invoices: "write.services",
  "customer-interactions": "write.requests",
  researchers: "write.research",
  "research-tasks": "write.research",
  "task-members": "write.research",
  "task-milestones": "write.research",
  "task-expenses": "write.research",
  "task-samples": "write.research",
  "provincial-projects": "write.research",
  "field-trials": "write.research",
  "knowledge-items": "write.research",
  "knowledge-authors": "write.research",
  "base-datasets": "write.research",
  "base-observations": "write.research",
  "ip-assets": "write.research",
  partners: "write.research",
  agreements: "write.research",
  "tech-transfers": "write.research",
  trainings: "write.research",
  contracts: "write.services",
  payments: "write.services",
  "tissue-materials": "write.tissue",
  "mother-plants": "write.tissue",
  "production-profiles": "write.tissue",
  "seedling-orders": "write.tissue",
  "tissue-supplies": "write.tissue",
  "supply-moves": "write.tissue",
  "lot-sales": "write.tissue",
  "lot-feedback": "write.tissue",
  "recipe-chemicals": "write.tissue",
  "media-batches": "write.tissue",
  cabinets: "write.tissue",
  "growth-rooms": "write.tissue",
  "media-recipes": "write.tissue",
  "culture-batches": "write.tissue",
  "seedling-lots": "write.tissue",
  varieties: "write.breeding",
  germplasm: "write.breeding",
  "breed-trials": "write.breeding",
  "variety-documents": "write.breeding",
  "source-stocks": "write.breeding",
  individuals: "write.breeding",
  "selection-records": "write.breeding",
  "breed-standards": "write.breeding",
  "standard-criteria": "write.breeding",
  "trial-observations": "write.breeding",
  "breed-production-lots": "write.breeding",
  "breed-production-logs": "write.breeding",
  "seed-lots": "write.breeding",
  "breed-demands": "write.breeding",
  "breed-orders": "write.breeding",
  "breed-deliveries": "write.breeding",
  markers: "write.breeding",
  "genotype-samples": "write.breeding",
  "genotype-calls": "write.breeding",
  "breed-facilities": "write.breeding",
  "breed-distributions": "write.breeding",
  "market-posts": "write.breeding",
  "sequence-refs": "write.breeding",
};

export const permissionForEntity = (collection: string): Permission => ENTITY_PERMISSION[collection] ?? "write.lab";

export function roleAllows(roles: readonly string[], perm: Permission) {
  const allowed = PERMISSIONS[perm].roles as readonly string[];
  return roles.some((r) => allowed.includes(r));
}

/** Kiểm tra lần gán vai trò đầu tiên: phải gán Quản trị cho chính người thực hiện (tránh tự khoá). */
export function validateBootstrap(assignments: { email: string; roles: string[] }[], actorEmail: string) {
  const self = assignments.find((a) => a.email.toLowerCase() === actorEmail.toLowerCase());
  return self?.roles.includes("Quản trị") ? null : "Lần phân quyền đầu tiên phải gán vai trò Quản trị cho chính tài khoản của bạn";
}
