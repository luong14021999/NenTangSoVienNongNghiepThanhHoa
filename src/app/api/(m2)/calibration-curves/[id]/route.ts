import { computeCurveFields, curveStore } from "@/lib/modules/m2/data/calc-methods";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(curveStore, { transform: (c) => computeCurveFields(c.pointsText) });
