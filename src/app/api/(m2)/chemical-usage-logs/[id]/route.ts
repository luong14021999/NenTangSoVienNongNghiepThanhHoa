import { chemicalUsageLogStore } from "@/lib/modules/m2/data/chemical-usage-logs";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(chemicalUsageLogStore);
export const DELETE = deleteRoute(chemicalUsageLogStore);
