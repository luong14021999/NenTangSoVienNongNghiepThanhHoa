import { trialObservationStore } from "@/lib/modules/m3/data/breeding";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(trialObservationStore);
