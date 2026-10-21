import { budgetStore, validateBudget, type UncertaintyBudget } from "@/lib/modules/m2/data/calc-methods";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<UncertaintyBudget>(
  budgetStore,
  { code: "", name: "", testLabel: "", componentsText: "", k: 2, includeRepeatability: true, includeCurve: false, note: "" },
  (b) => validateBudget(b),
);
