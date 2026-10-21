import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import {
  customerFeedbacks,
  type CustomerFeedback,
} from "@/lib/mock-data";

const SELECT =
  "id, code, customer_name, customer_kind, submitted_at, service_attitude, fee, quality, info_availability, delivery_time, comments, is_complaint, complaint_status, response_date, responder, response_note";

export const feedbackStore = createEntityStore<CustomerFeedback>(
  "feedback",
  customerFeedbacks,
  {
    table: "customer_feedback",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      code: (row.code as string) ?? "",
      customerName: (row.customer_name as string) ?? undefined,
      customerKind: (row.customer_kind as string) ?? undefined,
      submittedAt: (row.submitted_at as string) ?? "",
      serviceAttitude:
        (row.service_attitude as CustomerFeedback["serviceAttitude"]) ?? "Tốt",
      fee: (row.fee as CustomerFeedback["fee"]) ?? "Hợp lý",
      quality: (row.quality as CustomerFeedback["quality"]) ?? "Tốt",
      infoAvailability:
        (row.info_availability as CustomerFeedback["infoAvailability"]) ??
        "Tốt",
      deliveryTime:
        (row.delivery_time as CustomerFeedback["deliveryTime"]) ?? "Đúng hạn",
      comments: (row.comments as string) ?? undefined,
      isComplaint: (row.is_complaint as boolean) ?? false,
      complaintStatus:
        (row.complaint_status as CustomerFeedback["complaintStatus"]) ??
        undefined,
      responseDate: (row.response_date as string) ?? undefined,
      responder: (row.responder as string) ?? undefined,
      responseNote: (row.response_note as string) ?? undefined,
    }),
    toRow: (f) => {
      const r: Record<string, unknown> = {};
      if (f.code !== undefined) r.code = f.code;
      if (f.customerName !== undefined)
        r.customer_name = f.customerName || null;
      if (f.customerKind !== undefined)
        r.customer_kind = f.customerKind || null;
      if (f.submittedAt !== undefined)
        r.submitted_at = dateOrNull(f.submittedAt);
      if (f.serviceAttitude !== undefined)
        r.service_attitude = f.serviceAttitude;
      if (f.fee !== undefined) r.fee = f.fee;
      if (f.quality !== undefined) r.quality = f.quality;
      if (f.infoAvailability !== undefined)
        r.info_availability = f.infoAvailability;
      if (f.deliveryTime !== undefined) r.delivery_time = f.deliveryTime;
      if (f.comments !== undefined) r.comments = f.comments || null;
      if (f.isComplaint !== undefined) r.is_complaint = f.isComplaint;
      if (f.complaintStatus !== undefined)
        r.complaint_status = f.complaintStatus || null;
      if (f.responseDate !== undefined)
        r.response_date = dateOrNull(f.responseDate);
      if (f.responder !== undefined) r.responder = f.responder || null;
      if (f.responseNote !== undefined)
        r.response_note = f.responseNote || null;
      return r;
    },
  },
);
