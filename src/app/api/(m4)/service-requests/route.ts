import { serviceRequestStore, type ServiceRequest } from "@/lib/modules/m4/data/portal";
import { newRequestCode, routeRequest, validatePublicRequest } from "@/lib/modules/m4/portal";
import { createRoute, listRoute } from "@/lib/platform/api/crud";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

export const GET = listRoute(serviceRequestStore);

// Cán bộ nhập yêu cầu khách gửi trực tiếp / qua điện thoại; mã và đơn vị xử lý sinh như trên cổng.
export const POST = createRoute<ServiceRequest>(
  serviceRequestStore,
  (b) => {
    const kind = b.kind ?? "Khác";
    return {
      id: "",
      code: newRequestCode(Number(todayISO().slice(0, 4))),
      kind,
      targetUnit: b.targetUnit || routeRequest(kind),
      channel: b.channel ?? "Trực tiếp",
      orgName: b.orgName ?? "",
      contactName: b.contactName ?? "",
      phone: b.phone ?? "",
      email: b.email ?? "",
      address: b.address ?? "",
      description: b.description ?? "",
      sampleCount: b.sampleCount ?? 0,
      status: b.status ?? "Mới tiếp nhận",
      handler: b.handler ?? "",
      publicNote: b.publicNote ?? "",
      customerId: b.customerId ?? "",
      quotationId: b.quotationId ?? "",
      note: b.note ?? "",
    } as ServiceRequest;
  },
  (b) => {
    const v = validatePublicRequest(b as Record<string, unknown>);
    return "error" in v ? v.error : null;
  },
);
