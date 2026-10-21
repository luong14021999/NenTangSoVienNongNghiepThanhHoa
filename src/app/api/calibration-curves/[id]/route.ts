import { computeCurveFields, curveStore } from "@/lib/data/calc-methods";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(curveStore, { transform: (c) => computeCurveFields(c.pointsText) });
