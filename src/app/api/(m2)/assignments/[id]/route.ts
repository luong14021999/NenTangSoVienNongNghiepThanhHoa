import { assignmentStore } from "@/lib/modules/m2/data/custody";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(assignmentStore);
