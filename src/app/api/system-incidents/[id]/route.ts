import { incidentStore } from "@/lib/data/incidents";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(incidentStore);
