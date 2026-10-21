import { supplyStore } from "@/lib/modules/m2/data/supplies";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { Supply } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(supplyStore);

export const POST = createRoute<Supply>(
  supplyStore,
  (b) => ({
    id: "",
    code: b.code ?? "",
    name: b.name ?? "",
    unit: b.unit ?? "",
    qty: b.qty ?? 0,
    minQty: b.minQty ?? 0,
    location: b.location ?? "",
    note: b.note ?? "",
  }),
  (b) => {
    if (!b.code) return "Thiếu mã vật tư";
    if (!b.name) return "Thiếu tên vật tư";
    return null;
  },
);
