import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { Chemical } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(chemicalsStore);

export const POST = createRoute<Chemical>(
  chemicalsStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    name: body.name ?? "",
    cas: body.cas ?? "—",
    unit: body.unit ?? "",
    stock: body.stock ?? 0,
    minStock: body.minStock ?? 0,
    expiry: body.expiry ?? "",
    hazard: body.hazard ?? "Thường",
    location: body.location ?? "",
    technicalSpec: body.technicalSpec ?? "",
    manufacturer: body.manufacturer ?? "",
    manufactureDate: body.manufactureDate ?? "",
    receivedAt: body.receivedAt ?? new Date().toISOString().slice(0, 10),
    storageCondition: body.storageCondition ?? "",
    usedFor: body.usedFor ?? [],
    isReference: body.isReference ?? false,
  }),
  (body) => {
    if (!body.code) return "Thiếu mã hóa chất";
    if (!body.name) return "Thiếu tên hóa chất";
    return null;
  },
);
