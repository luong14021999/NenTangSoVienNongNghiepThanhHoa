import { toolUsageLogStore } from "@/lib/modules/m2/data/tool-usage-logs";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(toolUsageLogStore);
export const DELETE = deleteRoute(toolUsageLogStore);
