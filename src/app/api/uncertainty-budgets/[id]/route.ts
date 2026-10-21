import { budgetStore, validateBudget } from "@/lib/data/calc-methods";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(budgetStore, { validate: validateBudget });
