import { budgetStore, validateBudget } from "@/lib/modules/m2/data/calc-methods";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(budgetStore, { validate: validateBudget });
