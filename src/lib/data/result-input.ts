// Chuyển dữ liệu form "Nhập kết quả" → cột analysis_results (server-side).
import { accreditedTests, testNoOf } from "@/lib/accreditation";
import { samplesStore } from "./samples";
import { equipmentStore } from "./equipment";
import { decisionRuleStore } from "./quality";
import { applyRule, parseNum, parseNumbers, statsOf } from "./results";

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
};

export function validateInput(b: ResultInput) {
  if (!b.sampleCode) return "Thiếu mã mẫu";
  if (!b.testLabel || !Number.isFinite(testNoOf(b.testLabel))) return "Thiếu phép thử";
  if (parseNumbers(b.replicates ?? "").length === 0) return "Cần ít nhất 1 giá trị phép lặp (cách nhau bằng dấu ;)";
  return null;
}

/** Trả về các cột cần ghi + giá trị hiển thị để so sánh khi lưu vết. */
export async function buildResultColumns(b: ResultInput) {
  const [samples, equipment, rules] = await Promise.all([
    samplesStore.list(),
    equipmentStore.list(),
    decisionRuleStore.list(),
  ]);
  const test = accreditedTests.find((t) => t.no === testNoOf(b.testLabel ?? ""));
  const sample = samples.find((s) => s.code === b.sampleCode);
  const instrument = equipment.find((e) => e.code === b.instrumentCode);
  const rule = rules.find((r) => r.id === b.decisionRuleId);

  const values = parseNumbers(b.replicates ?? "");
  const { mean, sd, rsd } = statsOf(values);
  const u = parseNum(b.uncertainty);

  return {
    sample_code: b.sampleCode ?? "",
    customer_name: sample?.customer ?? "",
    matrix: test?.matrix ?? "",
    criterion: test ? `#${test.no} ${test.name.split(":")[0].split(" – ")[0]}` : "",
    method: test?.method.replace(/\s*\(Ref:.*\)$/, "") ?? "",
    unit: (b.unit ?? "").trim(),
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
  conclusion: "Kết luận",
};
