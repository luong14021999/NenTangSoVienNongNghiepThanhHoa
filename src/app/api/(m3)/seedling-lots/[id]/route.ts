import { seedlingLotStore } from "@/lib/modules/m3/data/tissue";
import { itemRoutes } from "@/lib/platform/api/crud";
import { validateGrading } from "@/lib/modules/m3/production";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(seedlingLotStore, { validate: validateGrading });
