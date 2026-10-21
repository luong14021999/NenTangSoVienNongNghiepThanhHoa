import { staffCommitmentStore } from "@/lib/modules/m2/data/competence";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(staffCommitmentStore);
