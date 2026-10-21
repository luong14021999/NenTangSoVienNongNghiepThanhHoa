// Trường form tài liệu kho tri thức dùng chung cho trang tìm kiếm và trang chi tiết.
import type { CrudField } from "@/components/crud/entity-form-dialog";
import { KNOWLEDGE_KINDS } from "@/lib/modules/m4/knowledge";
import { refOptions } from "@/lib/platform/ref-options";

export function knowledgeFields(tasks: { id: string; code: string; title: string }[], trials: { id: string; code: string; title: string }[]): CrudField[] {
  return [
    { name: "code", label: "Mã tài liệu", required: true, mono: true, placeholder: "VD: TT-2026-001" },
    { name: "kind", label: "Loại", type: "select", options: [...KNOWLEDGE_KINDS] },
    { name: "title", label: "Tiêu đề", required: true, full: true },
    { name: "taskId", label: "Thuộc nhiệm vụ", type: "select", options: refOptions(tasks, (t) => `${t.code} · ${t.title}`) },
    { name: "fieldTrialId", label: "Từ thí nghiệm", type: "select", options: refOptions(trials, (t) => `${t.code} · ${t.title}`) },
    { name: "publishedAt", label: "Ngày ban hành / công bố", type: "date" },
    { name: "source", label: "Nguồn (tạp chí, số hiệu…)" },
    { name: "keywords", label: "Từ khóa", full: true },
    { name: "externalAuthors", label: "Tác giả ngoài Viện", full: true },
    { name: "url", label: "Tệp gốc (https://…)", full: true },
    { name: "isPublic", label: "Công bố trên cổng công khai", type: "bool", boolLabels: ["Công bố", "Nội bộ"], defaultValue: 0 },
    { name: "abstract", label: "Tóm tắt (hiện trên cổng nếu công bố)", type: "textarea" },
    { name: "content", label: "Nội dung toàn văn (dán văn bản để tìm kiếm – không hiện trên cổng)", type: "textarea" },
    { name: "note", label: "Ghi chú nội bộ", type: "textarea" },
  ];
}
