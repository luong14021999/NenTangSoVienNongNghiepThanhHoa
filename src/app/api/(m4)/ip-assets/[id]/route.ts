import { ipAssetStore } from "@/lib/modules/m4/data/knowledge";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(ipAssetStore);
