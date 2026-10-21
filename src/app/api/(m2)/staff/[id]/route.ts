import { staffStore } from "@/lib/modules/m2/data/staff";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(staffStore);
export const DELETE = deleteRoute(staffStore);
