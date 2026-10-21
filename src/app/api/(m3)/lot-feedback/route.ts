import { lotFeedbackStore, type LotFeedback } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<LotFeedback>(
  lotFeedbackStore,
  {
    lotId: "",
    customerId: "",
    receivedAt: "",
    channel: "Cán bộ ghi nhận",
    contactName: "",
    phone: "",
    survivalPct: 0,
    rating: 0,
    content: "",
    response: "",
    status: "Mới",
    note: "",
  },
  (b) => (!b.content ? "Nhập nội dung phản hồi" : b.rating && (Number(b.rating) < 1 || Number(b.rating) > 5) ? "Đánh giá từ 1 đến 5" : null),
);
