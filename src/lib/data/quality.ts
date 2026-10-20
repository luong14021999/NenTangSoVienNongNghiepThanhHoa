// Rủi ro & cơ hội (§8.5), quy tắc quyết định (§7.8.6), QC nội bộ + PT (§7.7) – lưu Neon.
import { columnsMapping, createEntityStore, dateOrNull, type DbMapping } from "./factory";
import {
  risks as mockRisks,
  opportunities as mockOpportunities,
  decisionRules as mockDecisionRules,
  externalQCRounds as mockRounds,
  type DecisionRule,
  type ExternalQCRound,
  type Opportunity,
  type Risk,
} from "@/lib/mock-data";

// ── §8.5 Rủi ro & cơ hội ────────────────────────────────────────────
export const RISK_CATEGORIES: Risk["category"][] = [
  "Khách quan",
  "Năng lực nhân sự",
  "Thiết bị",
  "Phương pháp",
  "Cơ sở vật chất",
  "Dữ liệu & An ninh",
  "Cung ứng",
  "Khách hàng & Bên ngoài",
  "Quá trình",
];
export const RISK_TREATMENTS: Risk["treatment"][] = ["Né tránh", "Giảm thiểu", "Chuyển giao", "Chấp nhận"];
export const RISK_STATUSES: Risk["status"][] = ["Mở", "Đang xử lý", "Đã giảm thiểu", "Đã đóng"];
export const OPPORTUNITY_STATUSES: Opportunity["status"][] = ["Đề xuất", "Đang triển khai", "Đã đạt"];

/** L/I nằm trong 1..5 (ràng buộc CHECK của bảng risks). */
const scale = (v: unknown) => Math.min(5, Math.max(1, Math.round(Number(v) || 1))) as Risk["likelihood"];

const riskColumns = columnsMapping<Risk>("risks", {
  code: "text",
  category: "text",
  title: "text",
  cause: "text",
  effect: "text",
  likelihood: "number",
  impact: "number",
  controls: "text",
  treatment: "text",
  action: "text",
  owner: "text",
  reviewAt: "date",
  residualLikelihood: "number",
  residualImpact: "number",
  status: "text",
  isoClause: "text",
});

export const riskStore = createEntityStore<Risk>("risks", mockRisks, {
  ...riskColumns,
  toRow: (e) => {
    const r = riskColumns.toRow(e);
    for (const k of ["likelihood", "impact", "residual_likelihood", "residual_impact"])
      if (k in r) r[k] = scale(r[k]);
    return r;
  },
});

export const opportunityStore = createEntityStore<Opportunity>(
  "opportunities",
  mockOpportunities,
  columnsMapping<Opportunity>("opportunities", {
    title: "text",
    description: "text",
    expectedBenefit: "text",
    owner: "text",
    status: "text",
  }),
);

// ── §7.8.6 Quy tắc quyết định ───────────────────────────────────────
export const RULE_TYPES: DecisionRule["ruleType"][] = [
  "Simple acceptance (không guard band)",
  "Guarded acceptance (w = U)",
  "Guarded rejection (w = U)",
  "Theo thỏa thuận khách hàng",
];
export const LIMIT_DIRECTIONS: DecisionRule["limitDirection"][] = ["max", "min", "range"];

/** Số tùy chọn: null/"" ↔ undefined. */
const optNum = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : Number(v));
const numOrNull = (v: unknown) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

const ruleMapping: DbMapping<DecisionRule> = {
  table: "decision_rules",
  select:
    "id, criterion, matrix, method, unit, limit_value, limit_direction, limit_min, limit_source, uncertainty, rule_type, acceptance_upper, acceptance_lower, rejection_upper, rejection_lower, notes, approved_by, approved_at",
  toEntity: (r) => ({
    id: r.id as string,
    criterion: (r.criterion as string) ?? "",
    matrix: (r.matrix as string) ?? "",
    method: (r.method as string) ?? "",
    unit: (r.unit as string) ?? "",
    limit: Number(r.limit_value ?? 0),
    limitDirection: ((r.limit_direction as string) || "max") as DecisionRule["limitDirection"],
    limitMin: optNum(r.limit_min),
    limitSource: (r.limit_source as string) ?? "",
    uncertainty: Number(r.uncertainty ?? 0),
    ruleType: ((r.rule_type as string) || RULE_TYPES[0]) as DecisionRule["ruleType"],
    acceptanceUpper: optNum(r.acceptance_upper),
    acceptanceLower: optNum(r.acceptance_lower),
    rejectionUpper: optNum(r.rejection_upper),
    rejectionLower: optNum(r.rejection_lower),
    notes: (r.notes as string) ?? "",
    approvedBy: (r.approved_by as string) ?? "",
    approvedAt: (r.approved_at as string) ?? "",
  }),
  toRow: (e) => {
    const r: Record<string, unknown> = {};
    const text = { criterion: "criterion", matrix: "matrix", method: "method", unit: "unit", limitDirection: "limit_direction", limitSource: "limit_source", ruleType: "rule_type", notes: "notes", approvedBy: "approved_by" } as const;
    for (const [k, col] of Object.entries(text)) {
      const v = e[k as keyof DecisionRule];
      if (v !== undefined) r[col] = v;
    }
    const nums = { limit: "limit_value", limitMin: "limit_min", uncertainty: "uncertainty", acceptanceUpper: "acceptance_upper", acceptanceLower: "acceptance_lower", rejectionUpper: "rejection_upper", rejectionLower: "rejection_lower" } as const;
    for (const [k, col] of Object.entries(nums)) {
      if (k in e) r[col] = numOrNull(e[k as keyof DecisionRule]);
    }
    if (e.approvedAt !== undefined) r.approved_at = dateOrNull(e.approvedAt);
    return r;
  },
};

export const decisionRuleStore = createEntityStore<DecisionRule>("decision-rules", mockDecisionRules, ruleMapping);

// ── §7.7 QC nội bộ (biểu đồ kiểm soát) + PT / so sánh liên phòng ─────
export type QcChartRow = {
  id: string;
  criterion: string;
  matrix: string;
  method: string;
  unit: string;
  mean: number;
  sd: number;
  referenceMaterial: string;
};
export type QcPointRow = {
  id: string;
  chartId: string;
  date: string;
  value: number;
  technician: string;
};

export const qcChartStore = createEntityStore<QcChartRow>(
  "qc-charts",
  [],
  columnsMapping<QcChartRow>("qc_charts", {
    criterion: "text",
    matrix: "text",
    method: "text",
    unit: "text",
    mean: "number",
    sd: "number",
    referenceMaterial: "text",
  }),
);

export const qcPointStore = createEntityStore<QcPointRow>(
  "qc-points",
  [],
  columnsMapping<QcPointRow>("qc_points", {
    chartId: "text",
    date: "date",
    value: "number",
    technician: "text",
  }),
);

export const PT_TYPES: ExternalQCRound["type"][] = ["Thử nghiệm thành thạo", "So sánh liên phòng"];
export const PT_VERDICTS: ExternalQCRound["verdict"][] = ["Đạt", "Cảnh báo", "Không đạt"];

/** Đánh giá z-score theo ISO 13528: |z| ≤ 2 Đạt, 2 < |z| < 3 Cảnh báo, |z| ≥ 3 Không đạt. */
export const verdictOfZ = (z: number): ExternalQCRound["verdict"] =>
  Math.abs(z) <= 2 ? "Đạt" : Math.abs(z) < 3 ? "Cảnh báo" : "Không đạt";

export const ptRoundStore = createEntityStore<ExternalQCRound>(
  "pt-rounds",
  mockRounds,
  columnsMapping<ExternalQCRound>("external_qc_rounds", {
    type: "text",
    provider: "text",
    round: "text",
    criterion: "text",
    z: "number",
    verdict: "text",
    closedAt: "date",
  }),
);

/**
 * Ngưỡng vùng quyết định theo guard band w = U (JCGM 106:2012), giữ đúng quy ước
 * dữ liệu hiện có: chấp nhận ≤ L − U, bác bỏ > L + U (giới hạn trên); khoảng 2 phía
 * chấp nhận [Lmin + U, Lmax − U]. Simple / Theo thỏa thuận: không có guard band.
 */
/** Làm tròn 10 chữ số thập phân để tránh sai số dấu phẩy động ở biên (0,3 + 0,04 ≠ 0,34). */
const r10 = (n: number) => Math.round(n * 1e10) / 1e10;

export function zonesOf(r: Pick<DecisionRule, "ruleType" | "limitDirection" | "limit" | "limitMin" | "uncertainty">) {
  const none = { acceptanceUpper: undefined, rejectionUpper: undefined, acceptanceLower: undefined, rejectionLower: undefined };
  if (!r.ruleType.startsWith("Guarded")) return none;
  const u = Number(r.uncertainty) || 0;
  const L = Number(r.limit);
  if (r.limitDirection === "range" && r.limitMin !== undefined) {
    const Lmin = Number(r.limitMin);
    return { acceptanceUpper: r10(L - u), acceptanceLower: r10(Lmin + u), rejectionUpper: r10(L + u), rejectionLower: r10(Lmin - u) };
  }
  if (r.limitDirection === "min") {
    return { ...none, acceptanceLower: r10(L + u), rejectionLower: r10(L - u) };
  }
  return { ...none, acceptanceUpper: r10(L - u), rejectionUpper: r10(L + u) };
}

export type ConclusionValue = "Đạt" | "Không đạt" | "Vô định" | "Báo cáo giá trị";

/** Kết luận sự phù hợp của 1 kết quả theo quy tắc quyết định (§7.8.6). */
export function concludeWith(
  value: number,
  r: Pick<DecisionRule, "ruleType" | "limitDirection" | "limit" | "limitMin" | "uncertainty">,
): { conclusion: ConclusionValue; explanation: string } {
  const u = Number(r.uncertainty) || 0;
  const L = Number(r.limit);
  value = r10(value);
  const fmt = (n: number) => Number(n.toPrecision(6)).toString();
  if (r.ruleType === "Theo thỏa thuận khách hàng" || !Number.isFinite(value)) {
    return { conclusion: "Báo cáo giá trị", explanation: "Báo cáo giá trị đo theo thỏa thuận với khách hàng, không công bố sự phù hợp" };
  }
  const guarded = r.ruleType.startsWith("Guarded");
  const rejection = r.ruleType.startsWith("Guarded rejection");
  const inRange = (lo: number, hi: number) => value >= r10(lo) && value <= r10(hi);

  if (r.limitDirection === "range" && r.limitMin !== undefined) {
    const Lmin = Number(r.limitMin);
    if (!guarded) return inRange(Lmin, L)
      ? { conclusion: "Đạt", explanation: `${fmt(value)} nằm trong [${fmt(Lmin)}; ${fmt(L)}] – simple acceptance` }
      : { conclusion: "Không đạt", explanation: `${fmt(value)} nằm ngoài [${fmt(Lmin)}; ${fmt(L)}] – simple acceptance` };
    if (inRange(Lmin + u, L - u)) return { conclusion: "Đạt", explanation: `${fmt(value)} trong vùng chấp nhận [${fmt(Lmin + u)}; ${fmt(L - u)}] (w = U = ${fmt(u)})` };
    if (value < r10(Lmin - u) || value > r10(L + u)) return { conclusion: "Không đạt", explanation: `${fmt(value)} ngoài [${fmt(Lmin - u)}; ${fmt(L + u)}] (w = U = ${fmt(u)})` };
    return { conclusion: "Vô định", explanation: `${fmt(value)} trong vùng guard band quanh giới hạn (U = ${fmt(u)}) – không kết luận được với mức tin cậy 95%` };
  }

  const isMin = r.limitDirection === "min";
  const ok = (v: number) => (isMin ? value >= r10(v) : value <= r10(v));
  const sign = isMin ? "≥" : "≤";
  if (!guarded) return ok(L)
    ? { conclusion: "Đạt", explanation: `${fmt(value)} ${sign} ${fmt(L)} – simple acceptance` }
    : { conclusion: "Không đạt", explanation: `${fmt(value)} vượt giới hạn ${fmt(L)} – simple acceptance` };
  const accept = isMin ? L + u : L - u;
  const reject = isMin ? L - u : L + u;
  if (rejection) return ok(reject)
    ? { conclusion: "Đạt", explanation: `Chưa đủ bằng chứng vượt giới hạn: ${fmt(value)} ${sign} ${fmt(reject)} (guarded rejection, w = U = ${fmt(u)})` }
    : { conclusion: "Không đạt", explanation: `${fmt(value)} vượt ${fmt(reject)} = giới hạn ± U (guarded rejection)` };
  if (ok(accept)) return { conclusion: "Đạt", explanation: `${fmt(value)} ${sign} ${fmt(accept)} = giới hạn ∓ U (guarded acceptance, w = U = ${fmt(u)})` };
  if (!ok(reject)) return { conclusion: "Không đạt", explanation: `${fmt(value)} vượt ${fmt(reject)} = giới hạn ± U (guarded acceptance)` };
  return { conclusion: "Vô định", explanation: `${fmt(value)} trong vùng [${fmt(Math.min(accept, reject))}; ${fmt(Math.max(accept, reject))}] quanh giới hạn ${fmt(L)} – không kết luận được với mức tin cậy 95%` };
}
