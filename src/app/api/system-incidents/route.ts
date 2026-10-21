import { incidentStore, type SystemIncident } from "@/lib/data/incidents";
import { collectionRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SystemIncident>(
  incidentStore,
  {
    code: "",
    occurredAt: "",
    detectedBy: "",
    category: "Lỗi phần mềm",
    description: "",
    impact: "",
    action: "",
    status: "Mở",
    closedAt: "",
    ncCode: "",
  },
  (b) => (!b.code ? "Thiếu mã sự cố" : !b.description ? "Thiếu mô tả sự cố" : null),
);
