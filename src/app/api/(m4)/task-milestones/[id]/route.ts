import { taskMilestoneStore } from "@/lib/modules/m4/data/research";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(taskMilestoneStore);
