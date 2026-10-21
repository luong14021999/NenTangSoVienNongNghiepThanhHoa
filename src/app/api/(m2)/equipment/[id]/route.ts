import { equipmentStore } from "@/lib/modules/m2/data/equipment";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(equipmentStore);
export const DELETE = deleteRoute(equipmentStore);
