import { equipmentManualStore } from "@/lib/modules/m2/data/equipment-manuals";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(equipmentManualStore);
export const DELETE = deleteRoute(equipmentManualStore);
