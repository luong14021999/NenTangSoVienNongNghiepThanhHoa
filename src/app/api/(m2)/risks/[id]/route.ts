import { riskStore } from "@/lib/modules/m2/data/quality";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(riskStore);
