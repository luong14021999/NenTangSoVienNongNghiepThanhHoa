import { testRequestsStore } from "@/lib/modules/m2/data/test-requests";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(testRequestsStore);
export const DELETE = deleteRoute(testRequestsStore);
