import { methodValidationStore } from "@/lib/data/competence";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(methodValidationStore);
