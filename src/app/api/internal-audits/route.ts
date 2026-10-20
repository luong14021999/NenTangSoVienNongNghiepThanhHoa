import { internalAuditStore, type InternalAudit } from "@/lib/data/qms";
import { collectionRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<InternalAudit>(
  internalAuditStore,
  {
    code: "",
    plannedAt: "",
    conductedAt: "",
    scope: "",
    criteria: "",
    auditors: "",
    auditees: "",
    status: "Kế hoạch",
    findingsSummary: "",
    reportedTo: "",
  },
  (b) => (!b.code ? "Thiếu mã cuộc đánh giá" : null),
);
