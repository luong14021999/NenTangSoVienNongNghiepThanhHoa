import { genotypeCallStore } from "@/lib/modules/m3/data/genomics";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(genotypeCallStore);
