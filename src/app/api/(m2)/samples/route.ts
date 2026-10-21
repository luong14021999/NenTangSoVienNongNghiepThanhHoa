import { samplesStore } from "@/lib/modules/m2/data/samples";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { Sample } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(samplesStore);

export const POST = createRoute<Sample>(
  samplesStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    customer: body.customer ?? "",
    type: body.type ?? "",
    receivedAt: body.receivedAt ?? new Date().toISOString().slice(0, 10),
    dueAt: body.dueAt ?? "",
    technician: body.technician ?? "",
    status: body.status ?? "Đã tiếp nhận",
    progress: body.progress ?? 0,
    criteria: body.criteria ?? [],
  }),
  (body) => {
    if (!body.code) return "Thiếu mã mẫu";
    if (!body.customer) return "Thiếu khách hàng";
    if (!body.type) return "Thiếu loại mẫu";
    return null;
  },
);
