import { incidentStore } from "@/lib/modules/m2/data/incidents";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(incidentStore);
