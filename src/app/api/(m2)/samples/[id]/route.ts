import { samplesStore } from "@/lib/modules/m2/data/samples";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(samplesStore);
export const DELETE = deleteRoute(samplesStore);
