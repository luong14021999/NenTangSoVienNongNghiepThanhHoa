import { managementReviewStore, type ManagementReview } from "@/lib/data/qms";
import { collectionRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<ManagementReview>(
  managementReviewStore,
  {
    code: "",
    meetingAt: "",
    period: "",
    chair: "",
    participants: "",
    inputsNote: "",
    outputs: "",
    actions: "",
    status: "Kế hoạch",
  },
  (b) => (!b.code ? "Thiếu mã cuộc họp" : null),
);
