import { toolsStore } from "@/lib/modules/m2/data/tools";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { Tool } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(toolsStore);

export const POST = createRoute<Tool>(
  toolsStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    name: body.name ?? "",
    category: body.category ?? "Dụng cụ cầm tay",
    spec: body.spec ?? "",
    qty: body.qty ?? 0,
    unit: body.unit ?? "cái",
    minQty: body.minQty ?? 0,
    location: body.location ?? "",
    calibrationRequired: body.calibrationRequired ?? false,
    lastCalibration: body.lastCalibration,
    nextCalibration: body.nextCalibration,
    status: body.status ?? "Sẵn sàng",
  }),
  (body) => {
    if (!body.code) return "Thiếu mã dụng cụ";
    if (!body.name) return "Thiếu tên dụng cụ";
    return null;
  },
);
