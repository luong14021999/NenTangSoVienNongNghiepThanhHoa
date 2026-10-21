import { equipmentUsageLogStore } from "@/lib/modules/m2/data/equipment-usage-logs";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(equipmentUsageLogStore);
export const DELETE = deleteRoute(equipmentUsageLogStore);
