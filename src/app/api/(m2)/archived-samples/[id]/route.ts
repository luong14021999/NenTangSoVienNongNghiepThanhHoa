import { archivedSamplesStore } from "@/lib/modules/m2/data/archived-samples";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(archivedSamplesStore);
export const DELETE = deleteRoute(archivedSamplesStore);
