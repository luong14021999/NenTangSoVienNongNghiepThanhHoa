import { chemicalProfileStore } from "@/lib/modules/m2/data/chemical-profiles";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(chemicalProfileStore);
export const DELETE = deleteRoute(chemicalProfileStore);
