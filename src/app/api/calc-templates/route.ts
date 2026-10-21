import { calcTemplateStore, validateTemplate, type CalcTemplate } from "@/lib/data/calc-methods";
import { collectionRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<CalcTemplate>(
  calcTemplateStore,
  { code: "", name: "", testLabel: "", formula: "", readingVar: "", variablesText: "", resultUnit: "", useCurve: false, status: "Hiệu lực", note: "" },
  (b) => validateTemplate(b),
);
