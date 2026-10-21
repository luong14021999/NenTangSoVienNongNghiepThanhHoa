import { decisionRuleStore, zonesOf } from "@/lib/modules/m2/data/quality";
import { createRoute, listRoute } from "@/lib/platform/api/crud";
import type { DecisionRule } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const num = (v: unknown) => (v === undefined || v === "" || v === null ? undefined : Number(v));

export const GET = listRoute(decisionRuleStore);

export const POST = createRoute<DecisionRule>(
  decisionRuleStore,
  (b) => {
    const base = {
      ruleType: b.ruleType ?? "Simple acceptance (không guard band)",
      limitDirection: b.limitDirection ?? "max",
      limit: Number(b.limit ?? 0),
      limitMin: num(b.limitMin),
      uncertainty: Number(b.uncertainty ?? 0),
    } as const;
    return {
      id: "",
      criterion: b.criterion ?? "",
      matrix: b.matrix ?? "",
      method: b.method ?? "",
      unit: b.unit ?? "",
      limitSource: b.limitSource ?? "",
      notes: b.notes ?? "",
      approvedBy: b.approvedBy ?? "",
      approvedAt: b.approvedAt ?? "",
      ...base,
      ...zonesOf(base),
    };
  },
  (b) => (!b.criterion ? "Thiếu chỉ tiêu" : b.limitDirection === "range" && num(b.limitMin) === undefined ? "Giới hạn khoảng cần Giới hạn dưới" : null),
);
