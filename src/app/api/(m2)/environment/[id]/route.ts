import { environmentStore } from "@/lib/modules/m2/data/environment";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(environmentStore);
export const DELETE = deleteRoute(environmentStore);
