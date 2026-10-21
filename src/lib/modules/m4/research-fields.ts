// Trường form nhiệm vụ KH&CN dùng chung cho danh sách và trang chi tiết.
import type { CrudField } from "@/components/crud/entity-form-dialog";
import { ACCEPTANCE_RESULTS, RESEARCH_FIELDS, TASK_KINDS, TASK_LEVELS, TASK_STATUSES } from "@/lib/modules/m4/research";
import { refOptions } from "@/lib/platform/ref-options";

export function researchTaskFields(researchers: { id: string; code: string; fullName: string; degree: string }[]): CrudField[] {
  return [
    { name: "code", label: "Mã nhiệm vụ (để trống = tự đánh số)", mono: true, placeholder: "NV-2026-001" },
    { name: "kind", label: "Loại", type: "select", options: [...TASK_KINDS] },
    { name: "title", label: "Tên nhiệm vụ", required: true, full: true },
    { name: "level", label: "Cấp quản lý", type: "select", options: [...TASK_LEVELS] },
    { name: "field", label: "Lĩnh vực", type: "select", options: ["", ...RESEARCH_FIELDS] },
    { name: "leaderId", label: "Chủ nhiệm", type: "select", options: refOptions(researchers, (r) => `${r.degree ? r.degree + " " : ""}${r.fullName}`) },
    { name: "hostUnit", label: "Đơn vị chủ trì" },
    { name: "keywords", label: "Từ khóa (cách nhau dấu phẩy – dùng kiểm tra trùng lặp)", full: true },
    { name: "objectives", label: "Mục tiêu", type: "textarea" },
    { name: "startAt", label: "Bắt đầu", type: "date" },
    { name: "endAt", label: "Kết thúc", type: "date" },
    { name: "budgetState", label: "Kinh phí ngân sách nhà nước (VND)", type: "number" },
    { name: "budgetOther", label: "Kinh phí nguồn khác (VND)", type: "number" },
    { name: "status", label: "Trạng thái", type: "select", options: [...TASK_STATUSES] },
    { name: "approvalNo", label: "Số QĐ phê duyệt", mono: true },
    { name: "approvedAt", label: "Ngày phê duyệt", type: "date" },
    { name: "acceptanceResult", label: "Kết quả nghiệm thu", type: "select", options: ["", ...ACCEPTANCE_RESULTS] },
    { name: "acceptedAt", label: "Ngày nghiệm thu", type: "date" },
    { name: "outputs", label: "Sản phẩm (quy trình, giống, bài báo, sáng chế…)", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
}

export const taskStatusVariant: Record<string, "secondary" | "warning" | "default" | "success" | "destructive" | "outline"> = {
  "Đề xuất": "secondary",
  "Đang xét duyệt": "warning",
  "Được phê duyệt": "outline",
  "Đang thực hiện": "default",
  "Chờ nghiệm thu": "warning",
  "Đã nghiệm thu": "success",
  "Không phê duyệt": "destructive",
  "Dừng": "destructive",
};
