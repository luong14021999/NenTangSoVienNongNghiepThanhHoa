import { maintenanceLogStore } from "@/lib/modules/m2/data/maintenance-logs";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(maintenanceLogStore);
export const DELETE = deleteRoute(maintenanceLogStore);
