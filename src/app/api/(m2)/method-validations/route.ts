import { methodValidationStore, type MethodValidation } from "@/lib/modules/m2/data/competence";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<MethodValidation>(
  methodValidationStore,
  {
    code: "",
    testLabel: "",
    kind: "Kiểm tra xác nhận phương pháp tiêu chuẩn",
    performedAt: "",
    performedBy: "",
    lod: "",
    loq: "",
    linearity: "",
    repeatability: "",
    reproducibility: "",
    recovery: "",
    uncertainty: "",
    conclusion: "Đang thực hiện",
    approvedBy: "",
    nextReviewAt: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã báo cáo" : !b.testLabel ? "Thiếu phép thử" : null),
);
