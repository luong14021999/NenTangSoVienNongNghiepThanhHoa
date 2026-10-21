import { assignmentStore } from "@/lib/data/custody";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(assignmentStore);
