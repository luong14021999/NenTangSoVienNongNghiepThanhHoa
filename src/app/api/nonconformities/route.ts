import { nonconformityStore, type Nonconformity } from "@/lib/data/qms";
import { collectionRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Nonconformity>(
  nonconformityStore,
  {
    code: "",
    detectedAt: "",
    source: "Công việc thử nghiệm",
    refCode: "",
    clause: "",
    description: "",
    severity: "Nhẹ",
    impact: "",
    immediateAction: "",
    rootCause: "",
    correctiveAction: "",
    owner: "",
    dueAt: "",
    status: "Mở",
    effectiveness: "",
    closedAt: "",
  },
  (b) => (!b.code ? "Thiếu mã" : !b.description ? "Thiếu mô tả sự không phù hợp" : null),
);
