import { feedbackStore } from "@/lib/modules/m2/data/feedback";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { CustomerFeedback } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(feedbackStore);

export const POST = createRoute<CustomerFeedback>(
  feedbackStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    customerName: body.customerName,
    customerKind: body.customerKind,
    submittedAt:
      body.submittedAt ?? new Date().toISOString().slice(0, 10),
    serviceAttitude: body.serviceAttitude ?? "Tốt",
    fee: body.fee ?? "Hợp lý",
    quality: body.quality ?? "Tốt",
    infoAvailability: body.infoAvailability ?? "Tốt",
    deliveryTime: body.deliveryTime ?? "Đúng hạn",
    comments: body.comments,
    isComplaint: body.isComplaint ?? false,
    complaintStatus: body.complaintStatus,
    responseDate: body.responseDate,
    responder: body.responder,
    responseNote: body.responseNote,
  }),
  (body) => {
    if (!body.code) return "Thiếu mã phiếu";
    return null;
  },
);
