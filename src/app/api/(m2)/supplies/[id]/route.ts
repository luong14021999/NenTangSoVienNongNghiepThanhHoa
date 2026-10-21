import { supplyStore } from "@/lib/modules/m2/data/supplies";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(supplyStore);
export const DELETE = deleteRoute(supplyStore);
