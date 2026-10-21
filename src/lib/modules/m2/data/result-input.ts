// Chuyển dữ liệu form "Nhập kết quả" → cột analysis_results (server-side).
import { accreditedTests, testNoOf } from "@/lib/modules/m2/accreditation";
import { samplesStore } from "./samples";
import { equipmentStore } from "./equipment";
import { decisionRuleStore } from "./quality";
import { applyRule, parseNum, parseNumbers } from "./results";
import { budgetStore, calcTemplateStore, curveStore } from "./calc-methods";
import { computeResult } from "@/lib/modules/m2/calc/compute-result";
import { parseComponents, parsePoints, parseVariables } from "@/lib/modules/m2/calc/text-formats";
import { toNumber } from "@/lib/modules/m2/calc/csv";

/** Giá trị form (đều là chuỗi) – xem RESULT_FIELDS ở trang /result-entry. */
export type ResultInput = {
  sampleCode?: string;
  testLabel?: string;
  unit?: string;
  instrumentCode?: string;
  referenceMaterial?: string;
  replicates?: string;
  uncertainty?: string;
  matrixSpikeRecovery?: string;
  blankValue?: string;
  decisionRuleId?: string;
  /** M2.4: công thức theo phương pháp, đường chuẩn, ngân sách ĐKĐBĐ (tùy chọn). */
  templateId?: string;
  curveId?: string;
  budgetId?: string;
  /** Giá trị biến công thức, VD {"m": "1,0025", "f": "2"}. */
  varValues?: Record<string, string>;
  /** File dữ liệu thô từ thiết bị (nội dung văn bản CSV/TXT). */
  rawFile?: { name: string; content: string };
};

export const RAW_FILE_MAX = 500_000; // ký tự

export function validateInput(b: ResultInput) {
  if (!b.sampleCode) return "Thiếu mã mẫu";
  if (!b.testLabel || !Number.isFinite(testNoOf(b.testLabel))) return "Thiếu phép thử";
  if (parseNumbers(b.replicates ?? "").length === 0) return "Cần ít nhất 1 giá trị phép lặp (cách nhau bằng dấu ;)";
  if (b.rawFile && b.rawFile.content.length > RAW_FILE_MAX) return "File dữ liệu thô quá lớn (tối đa ~500 KB văn bản)";
  return null;
}

/** Trả về các cột cần ghi + giá trị hiển thị để so sánh khi lưu vết. */
export async function buildResultColumns(b: ResultInput) {
  const [samples, equipment, rules, templates, curves, budgets] = await Promise.all([
    samplesStore.list(),
    equipmentStore.list(),
    decisionRuleStore.list(),
    calcTemplateStore.list(),
    curveStore.list(),
    budgetStore.list(),
  ]);
  const template = templates.find((t) => t.id === b.templateId);
  const curve = curves.find((c) => c.id === b.curveId);
  const budget = budgets.find((x) => x.id === b.budgetId);
  const test = accreditedTests.find((t) => t.no === testNoOf(b.testLabel ?? ""));
  const sample = samples.find((s) => s.code === b.sampleCode);
  const instrument = equipment.find((e) => e.code === b.instrumentCode);
  const rule = rules.find((r) => r.id === b.decisionRuleId);

  // Tính chính thức ở server (không tin giá trị tính sẵn từ trình duyệt).
  const computed = computeResult({
    readings: parseNumbers(b.replicates ?? ""),
    template: template && {
      code: template.code,
      formula: template.formula,
      readingVar: template.readingVar,
      variables: parseVariables(template.variablesText),
      useCurve: template.useCurve,
      resultUnit: template.resultUnit,
    },
    varValues: Object.fromEntries(
      Object.entries(b.varValues ?? {})
        .map(([k, v]) => [k, toNumber(String(v))] as const)
        .filter(([, v]) => Number.isFinite(v)),
    ),
    curve: curve && { code: curve.code, points: parsePoints(curve.pointsText), r2Min: curve.r2Min, validUntil: curve.validUntil, concUnit: curve.concUnit },
    budget: budget && {
      code: budget.code,
      components: parseComponents(budget.componentsText),
      k: budget.k,
      includeRepeatability: budget.includeRepeatability,
      includeCurve: budget.includeCurve,
    },
    manualU: parseNum(b.uncertainty),
  });
  const values = computed.values;
  const { mean, sd, rsd } = computed;
  const u = computed.U;

  return {
    sample_code: b.sampleCode ?? "",
    customer_name: sample?.customer ?? "",
    matrix: test?.matrix ?? "",
    criterion: test ? `#${test.no} ${test.name.split(":")[0].split(" – ")[0]}` : "",
    method: test?.method.replace(/\s*\(Ref:.*\)$/, "") ?? "",
    unit: (b.unit ?? "").trim() || template?.resultUnit || "",
    template_id: template?.id ?? null,
    curve_id: curve?.id ?? null,
    budget_id: budget?.id ?? null,
    calc_detail: computed.calcDetail,
    uncertainty_detail: computed.uncertaintyDetail ?? null,
    instrument_code: instrument?.code ?? "",
    instrument_name: instrument?.name ?? "",
    reference_material: (b.referenceMaterial ?? "").trim(),
    replicates: values.map((value, i) => ({ id: i + 1, value })),
    mean: mean ?? null,
    sd: sd ?? null,
    rsd: rsd ?? null,
    uncertainty: u ?? null,
    matrix_spike_recovery: parseNum(b.matrixSpikeRecovery) ?? null,
    blank_value: parseNum(b.blankValue) ?? null,
    ...applyRule(mean, u, rule),
  };
}

/** Các cột được theo dõi trong lưu vết khi sửa, kèm nhãn tiếng Việt. */
export const AUDITED: Record<string, string> = {
  sample_code: "Mã mẫu",
  criterion: "Phép thử",
  unit: "Đơn vị",
  instrument_code: "Thiết bị",
  reference_material: "Mẫu chuẩn QC",
  replicates: "Phép lặp",
  mean: "x̄",
  uncertainty: "U",
  matrix_spike_recovery: "Độ thu hồi",
  blank_value: "Mẫu trắng",
  decision_rule_type: "Quy tắc quyết định",
  readings: "Số đọc thiết bị",
  calc_template: "Công thức & biến",
  calc_curve: "Đường chuẩn",
  uncertainty_budget: "Ngân sách ĐKĐBĐ",
  conclusion: "Kết luận",
};
