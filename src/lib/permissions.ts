// Phân quyền theo vai trò (ISO/IEC 17025:2017 §7.11.3, §6.2.6): hàm thuần, kiểm thử được.
// Nguyên tắc tách nhiệm vụ: người nhập ≠ người duyệt ≠ người phê duyệt; Quản trị hệ thống không duyệt kết quả.

export const ROLES = ["Quản trị", "Trưởng phòng", "QA/QC", "KTV", "Tiếp nhận mẫu", "Chỉ xem"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  "admin.users": { label: "Quản lý tài khoản & phân quyền", roles: ["Quản trị"] },
  "results.enter": { label: "Nhập / sửa / nộp kết quả phân tích", roles: ["KTV", "Trưởng phòng"] },
  "results.qa": { label: "QA/QC duyệt hoặc trả lại kết quả", roles: ["QA/QC", "Trưởng phòng"] },
  "results.approve": { label: "Phê duyệt kết quả (ký điện tử)", roles: ["Trưởng phòng"] },
  "reports.issue": { label: "Phát hành phiếu kết quả (ký điện tử)", roles: ["Trưởng phòng", "QA/QC"] },
  "reports.revoke": { label: "Thu hồi phiếu kết quả (ký điện tử)", roles: ["Trưởng phòng"] },
  "rules.draft": { label: "Soạn quy tắc kiểm soát phát hành", roles: ["QA/QC", "Trưởng phòng"] },
  "rules.approve": { label: "Phê duyệt quy tắc kiểm soát phát hành", roles: ["Trưởng phòng"] },
  "write.personnel": { label: "Nhân sự, ủy quyền phép thử, cam kết", roles: ["Trưởng phòng", "Quản trị"] },
  "write.quality": { label: "Tài liệu, đánh giá nội bộ, xem xét lãnh đạo, rủi ro, quy tắc quyết định, nhà cung cấp, xác nhận PP", roles: ["QA/QC", "Trưởng phòng", "Quản trị"] },
  "write.lab": { label: "Thiết bị, hóa chất, dụng cụ, QC, môi trường, nhật ký", roles: ["KTV", "QA/QC", "Trưởng phòng", "Quản trị"] },
  "write.reception": { label: "Khách hàng, phiếu yêu cầu, tiếp nhận mẫu, mẫu lưu, ý kiến KH", roles: ["Tiếp nhận mẫu", "KTV", "QA/QC", "Trưởng phòng", "Quản trị"] },
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
  nonconformities: "write.any",
  "system-incidents": "write.any",
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
