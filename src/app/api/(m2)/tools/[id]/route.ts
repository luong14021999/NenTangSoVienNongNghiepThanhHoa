import { toolsStore } from "@/lib/modules/m2/data/tools";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(toolsStore);
export const DELETE = deleteRoute(toolsStore);
