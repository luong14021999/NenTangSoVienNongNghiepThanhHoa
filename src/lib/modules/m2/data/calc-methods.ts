// Công thức tính, đường chuẩn, ngân sách độ không đảm bảo đo (M2.4, M2.5, §7.6).
import { columnsMapping, createEntityStore } from "../../../platform/data/factory";
import { fitLinear } from "@/lib/modules/m2/calc/regression";
import { parseComponents, parsePoints, parseVariables } from "@/lib/modules/m2/calc/text-formats";
import { variablesOf } from "@/lib/modules/m2/calc/expression";

// ── Công thức tính ──────────────────────────────────────────────────
export type CalcTemplate = {
  id: string;
  code: string;
  name: string;
  testLabel: string;
  formula: string;
  readingVar: string;
  variablesText: string;
  resultUnit: string;
  useCurve: boolean;
  status: "Hiệu lực" | "Ngừng sử dụng";
  note: string;
};

export const calcTemplateStore = createEntityStore<CalcTemplate>(
  "calc-templates",
  [],
  columnsMapping<CalcTemplate>("calc_templates", {
    code: "text",
    name: "text",
    testLabel: "text",
    formula: "text",
    readingVar: "text",
    variablesText: "text",
    resultUnit: "text",
    useCurve: "bool",
    status: "text",
    note: "text",
  }),
);

/** Kiểm tra công thức: cú pháp đúng, biến số đọc có mặt, mọi biến khác đều được khai báo. */
export function validateTemplate(t: Partial<CalcTemplate>): string | null {
  if (!t.code || !t.name) return "Thiếu mã hoặc tên công thức";
  if (!t.formula?.trim()) return "Thiếu công thức";
  if (!t.readingVar?.trim()) return "Thiếu biến nhận số đọc";
  try {
    const used = variablesOf(t.formula);
    const declared = parseVariables(t.variablesText ?? "").map((v) => v.key);
    if (!used.includes(t.readingVar)) return `Công thức không dùng biến số đọc "${t.readingVar}"`;
    const missing = used.filter((v) => v !== t.readingVar && !declared.includes(v));
    if (missing.length) return `Biến chưa khai báo: ${missing.join(", ")}`;
  } catch (e) {
    return `Công thức lỗi: ${(e as Error).message}`;
  }
  return null;
}

// ── Đường chuẩn ─────────────────────────────────────────────────────
export type CalibrationCurve = {
  id: string;
  code: string;
  testLabel: string;
  instrumentCode: string;
  analyzedAt: string;
  validUntil: string;
  analyst: string;
  concUnit: string;
  signalUnit: string;
  pointsText: string;
  r2Min: number;
  n: number;
  slope: number;
  intercept: number;
  r2: number;
  syx: number;
  lod: number;
  loq: number;
  minConc: number;
  maxConc: number;
  note: string;
};

export const curveStore = createEntityStore<CalibrationCurve>(
  "calibration-curves",
  [],
  columnsMapping<CalibrationCurve>("calibration_curves", {
    code: "text",
    testLabel: "text",
    instrumentCode: "text",
    analyzedAt: "date",
    validUntil: "date",
    analyst: "text",
    concUnit: "text",
    signalUnit: "text",
    pointsText: "text",
    r2Min: "number",
    n: "number",
    slope: "number",
    intercept: "number",
    r2: "number",
    syx: "number",
    lod: "number",
    loq: "number",
    minConc: "number",
    maxConc: "number",
    note: "text",
  }),
);

/** Tính hồi quy từ điểm chuẩn – gọi khi thêm / sửa đường chuẩn (không tin số liệu fit từ client). */
export function computeCurveFields(pointsText: string) {
  const fit = fitLinear(parsePoints(pointsText));
  return {
    n: fit.n,
    slope: fit.slope,
    intercept: fit.intercept,
    r2: fit.r2,
    syx: fit.syx,
    lod: fit.lod,
    loq: fit.loq,
    minConc: fit.minConc,
    maxConc: fit.maxConc,
  };
}

// ── Ngân sách độ không đảm bảo đo ────────────────────────────────────
export type UncertaintyBudget = {
  id: string;
  code: string;
  name: string;
  testLabel: string;
  componentsText: string;
  k: number;
  includeRepeatability: boolean;
  includeCurve: boolean;
  note: string;
};

export const budgetStore = createEntityStore<UncertaintyBudget>(
  "uncertainty-budgets",
  [],
  columnsMapping<UncertaintyBudget>("uncertainty_budgets", {
    code: "text",
    name: "text",
    testLabel: "text",
    componentsText: "text",
    k: "number",
    includeRepeatability: "bool",
    includeCurve: "bool",
    note: "text",
  }),
);

export function validateBudget(b: Partial<UncertaintyBudget>): string | null {
  if (!b.code || !b.name) return "Thiếu mã hoặc tên ngân sách";
  if (!(Number(b.k) > 0)) return "Hệ số phủ k phải > 0";
  try {
    const c = parseComponents(b.componentsText ?? "");
    if (!c.length && !b.includeRepeatability && !b.includeCurve) return "Ngân sách chưa có thành phần nào";
  } catch (e) {
    return (e as Error).message;
  }
  return null;
}
