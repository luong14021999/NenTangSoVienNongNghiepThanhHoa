import { supplierStore, type Supplier } from "@/lib/data/competence";
import { collectionRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Supplier>(
  supplierStore,
  {
    code: "",
    name: "",
    category: "Hóa chất & chất chuẩn",
    provides: "",
    contact: "",
    phone: "",
    accreditation: "",
    status: "Đang đánh giá",
    evaluatedAt: "",
    result: "",
    nextEvaluationAt: "",
    criteria: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã nhà cung cấp" : !b.name ? "Thiếu tên nhà cung cấp" : null),
);
