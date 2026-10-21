import { chemicalsStore } from "@/lib/modules/m2/data/chemicals";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(chemicalsStore);
export const DELETE = deleteRoute(chemicalsStore);
