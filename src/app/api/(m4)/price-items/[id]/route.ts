import { priceItemStore } from "@/lib/modules/m4/data/portal";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(priceItemStore);
