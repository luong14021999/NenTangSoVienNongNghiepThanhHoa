import { riskStore } from "@/lib/data/quality";
import { collectionRoutes } from "@/lib/api/crud";
import type { Risk } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Risk>(
  riskStore,
  {
    code: "",
    category: "Quá trình",
    title: "",
    cause: "",
    effect: "",
    likelihood: 1,
    impact: 1,
    controls: "",
    treatment: "Giảm thiểu",
    action: "",
    owner: "",
    reviewAt: "",
    residualLikelihood: 1,
    residualImpact: 1,
    status: "Mở",
    isoClause: "",
  },
  (b) => (!b.code ? "Thiếu mã rủi ro" : !b.title ? "Thiếu tên rủi ro" : null),
);
