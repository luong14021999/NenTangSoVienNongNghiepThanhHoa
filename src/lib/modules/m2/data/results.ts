// Kết quả phân tích + luồng duyệt 3 cấp + lưu vết (ISO/IEC 17025:2017 §7.5, §7.8.1, §7.11).
import { dbQuery, isDbConfigured } from "@/lib/platform/db";
import type {
  AnalysisResult,
  ApprovalRecord,
  AuditEvent,
  DecisionRule,
  Replicate,
  ResultStatus,
} from "@/lib/mock-data";
import { concludeWith, zonesOf } from "./quality";

import type { CalcDetail, ComputeOutput } from "@/lib/modules/m2/calc/compute-result";

export type ResultRow = AnalysisResult & {
  createdAt: string;
  templateId: string;
  curveId: string;
  budgetId: string;
  calcDetail: CalcDetail | null;
  uncertaintyDetail: ComputeOutput["uncertaintyDetail"] | null;
};
export type AuditRow = AuditEvent & { id: string };

export const RESULT_STATUSES: ResultStatus[] = [
  "Đang nhập",
  "Chờ QA/QC",
  "Chờ Trưởng phòng",
  "Đã duyệt",
  "Trả lại sửa",
];
export const EDITABLE: ResultStatus[] = ["Đang nhập", "Trả lại sửa"];

const COLS =
  "id, result_code, sample_code, customer_name, matrix, criterion, unit, method, instrument_code, instrument_name, reference_material, technician, started_at, finished_at, replicates, mean, sd, rsd, uncertainty, matrix_spike_recovery, blank_value, decision_rule_id, decision_rule_type, decision_limit, acceptance_upper, rejection_upper, conclusion, conclusion_explanation, raw_files, approvals, status, qa_comment, manager_comment, created_at, template_id, curve_id, budget_id, calc_detail, uncertainty_detail";

const n = (v: unknown) => (v === null || v === undefined ? NaN : Number(v));

function toResult(r: Record<string, unknown>): ResultRow {
  return {
    id: r.id as string,
    resultCode: (r.result_code as string) ?? "",
    sampleCode: (r.sample_code as string) ?? "",
    customerName: (r.customer_name as string) ?? "",
    matrix: (r.matrix as string) ?? "",
    criterion: (r.criterion as string) ?? "",
    unit: (r.unit as string) ?? "",
    method: (r.method as string) ?? "",
    instrument: { code: (r.instrument_code as string) ?? "", name: (r.instrument_name as string) ?? "" },
    referenceMaterial: (r.reference_material as string) ?? "",
    technician: (r.technician as string) ?? "",
    startedAt: (r.started_at as string) ?? "",
    finishedAt: (r.finished_at as string) ?? undefined,
    replicates: (r.replicates as Replicate[]) ?? [],
    mean: n(r.mean),
    sd: n(r.sd),
    rsd: n(r.rsd),
    uncertainty: n(r.uncertainty),
    matrixSpikeRecovery: n(r.matrix_spike_recovery),
    blankBlankValue: n(r.blank_value),
    decisionRuleId: (r.decision_rule_id as string) ?? "",
    decisionRuleType: (r.decision_rule_type as string) ?? "",
    decisionLimit: n(r.decision_limit),
    acceptanceUpper: n(r.acceptance_upper),
    rejectionUpper: n(r.rejection_upper),
    conclusion: ((r.conclusion as string) || "Báo cáo giá trị") as AnalysisResult["conclusion"],
    conclusionExplanation: (r.conclusion_explanation as string) ?? "",
    rawFiles: (r.raw_files as AnalysisResult["rawFiles"]) ?? [],
    status: ((r.status as string) || "Đang nhập") as ResultStatus,
    approvals: (r.approvals as ApprovalRecord[]) ?? [],
    auditTrail: [],
    qaComment: (r.qa_comment as string) ?? undefined,
    managerComment: (r.manager_comment as string) ?? undefined,
    createdAt: (r.created_at as string) ?? "",
    templateId: (r.template_id as string) ?? "",
    curveId: (r.curve_id as string) ?? "",
    budgetId: (r.budget_id as string) ?? "",
    calcDetail: (r.calc_detail as CalcDetail) ?? null,
    uncertaintyDetail: (r.uncertainty_detail as ComputeOutput["uncertaintyDetail"]) ?? null,
  };
}

export async function listResults(): Promise<ResultRow[]> {
  if (!isDbConfigured()) return [];
  const rows = await dbQuery(`select ${COLS} from public.analysis_results order by created_at desc`);
  return rows.map(toResult);
}

export async function getResult(id: string): Promise<ResultRow | null> {
  const [row] = await dbQuery(`select ${COLS} from public.analysis_results where id = $1`, [id]);
  return row ? toResult(row) : null;
}

/** Ghi các cột (snake_case) – json_populate_record ép kiểu jsonb/numeric/timestamptz. */
export async function insertResult(row: Record<string, unknown>) {
  const cols = Object.keys(row).map((c) => `"${c}"`).join(", ");
  const [created] = await dbQuery(
    `insert into public.analysis_results (${cols})
     select ${cols} from json_populate_record(null::public.analysis_results, $1::json)
     returning ${COLS}`,
    [JSON.stringify(row)],
  );
  return toResult(created);
}

export async function updateResult(id: string, row: Record<string, unknown>) {
  const cols = Object.keys(row).map((c) => `"${c}"`).join(", ");
  const [updated] = await dbQuery(
    `update public.analysis_results set (${cols}) =
       (select ${cols} from json_populate_record(null::public.analysis_results, $1::json))
     where id = $2 returning ${COLS}`,
    [JSON.stringify(row), id],
  );
  return updated ? toResult(updated) : null;
}

export async function deleteResult(id: string) {
  const rows = await dbQuery(`delete from public.analysis_results where id = $1 returning id`, [id]);
  return rows.length > 0;
}

export async function listAudit(resultId: string): Promise<AuditRow[]> {
  const rows = await dbQuery(
    `select id, at, actor, action, detail, field, old_value, new_value
     from public.analysis_audit_events where result_id = $1 order by at desc`,
    [resultId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    at: r.at as string,
    actor: (r.actor as string) ?? "",
    action: (r.action as string) ?? "",
    detail: (r.detail as string) ?? undefined,
    field: (r.field as string) ?? undefined,
    oldValue: (r.old_value as string) ?? undefined,
    newValue: (r.new_value as string) ?? undefined,
  }));
}

export async function addAudit(
  resultId: string,
  e: { actor: string; action: string; detail?: string; field?: string; oldValue?: string; newValue?: string },
) {
  await dbQuery(
    `insert into public.analysis_audit_events (result_id, actor, action, detail, field, old_value, new_value)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [resultId, e.actor, e.action, e.detail ?? null, e.field ?? null, e.oldValue ?? null, e.newValue ?? null],
  );
}

/** Mã kết quả kế tiếp trong năm: KQ-VNNTH-YYYY-NNNNN. */
export async function nextResultCode(year: string) {
  const prefix = `KQ-VNNTH-${year}-`;
  const [row] = await dbQuery(
    `select coalesce(max(substring(result_code from $2)::int), 0) as n
     from public.analysis_results where result_code like $1`,
    [`${prefix}%`, `^${prefix}(\\d+)$`],
  );
  return `${prefix}${String(Number(row?.n ?? 0) + 1).padStart(5, "0")}`;
}

// ── Tính toán ───────────────────────────────────────────────────────

/** "0,232; 0,241 0.238" → [0.232, 0.241, 0.238] (chấp nhận dấu phẩy thập phân). */
export function parseNumbers(text: string): number[] {
  return String(text ?? "")
    .split(/[;\s|]+/)
    .map((s) => s.trim().replace(",", "."))
    .filter(Boolean)
    .map(Number)
    .filter((x) => Number.isFinite(x));
}

/** Số tùy chọn từ ô nhập (cho phép dấu phẩy thập phân); undefined nếu trống. */
export const parseNum = (v: unknown) => {
  const s = String(v ?? "").trim().replace(",", ".");
  return s === "" || !Number.isFinite(Number(s)) ? undefined : Number(s);
};

const sig = (x: number, digits: number) => Number(x.toPrecision(digits));

export function statsOf(values: number[]) {
  const k = values.length;
  if (!k) return { mean: undefined, sd: undefined, rsd: undefined };
  const mean = values.reduce((a, b) => a + b, 0) / k;
  const sd = k > 1 ? Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (k - 1)) : 0;
  return {
    mean: sig(mean, 4),
    sd: sig(sd, 3),
    rsd: mean !== 0 ? Math.round((sd / Math.abs(mean)) * 10000) / 100 : 0,
  };
}

/** Áp quy tắc quyết định (dùng U của kết quả nếu có, ngược lại U của quy tắc). */
export function applyRule(mean: number | undefined, u: number | undefined, rule?: DecisionRule) {
  if (!rule || mean === undefined) {
    return {
      decision_rule_id: rule?.id ?? null,
      decision_rule_type: rule?.ruleType ?? "Không công bố sự phù hợp",
      decision_limit: rule?.limit ?? null,
      acceptance_upper: null,
      rejection_upper: null,
      conclusion: "Báo cáo giá trị",
      conclusion_explanation: rule ? "Chưa có giá trị đo" : "Báo cáo giá trị đo, không công bố sự phù hợp",
    };
  }
  const effective = { ...rule, uncertainty: u ?? rule.uncertainty };
  const zones = zonesOf(effective);
  const { conclusion, explanation } = concludeWith(mean, effective);
  return {
    decision_rule_id: rule.id,
    decision_rule_type: rule.ruleType,
    decision_limit: rule.limit,
    acceptance_upper: zones.acceptanceUpper ?? null,
    rejection_upper: zones.rejectionUpper ?? null,
    conclusion,
    conclusion_explanation: explanation,
  };
}

export const WORKFLOW_STEPS: ApprovalRecord["step"][] = ["KTV nhập", "QA/QC kiểm tra", "Trưởng phòng duyệt"];

export const initialApprovals = (): ApprovalRecord[] =>
  WORKFLOW_STEPS.map((step) => ({ step, actor: "—", role: "—", decision: "Chờ" }));

/** Chuyển trạng thái hợp lệ của luồng duyệt. */
export const TRANSITIONS = {
  submit: { from: ["Đang nhập", "Trả lại sửa"], to: "Chờ QA/QC", step: "KTV nhập", decision: "Đạt", label: "Nộp QA/QC" },
  qa_approve: { from: ["Chờ QA/QC"], to: "Chờ Trưởng phòng", step: "QA/QC kiểm tra", decision: "Đạt", label: "QA/QC duyệt" },
  qa_reject: { from: ["Chờ QA/QC"], to: "Trả lại sửa", step: "QA/QC kiểm tra", decision: "Trả lại sửa", label: "QA/QC trả lại" },
  manager_approve: { from: ["Chờ Trưởng phòng"], to: "Đã duyệt", step: "Trưởng phòng duyệt", decision: "Đạt", label: "Trưởng phòng phê duyệt" },
  manager_reject: { from: ["Chờ Trưởng phòng"], to: "Trả lại sửa", step: "Trưởng phòng duyệt", decision: "Trả lại sửa", label: "Trưởng phòng trả lại" },
} as const satisfies Record<
  string,
  { from: ResultStatus[]; to: ResultStatus; step: ApprovalRecord["step"]; decision: ApprovalRecord["decision"]; label: string }
>;
export type TransitionAction = keyof typeof TRANSITIONS;

/** Thời điểm hiện tại theo giờ VN, dạng "YYYY-MM-DD HH:mm" (hiển thị trên phiếu). */
export function nowVN() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

// ── File dữ liệu thô (§7.5: dữ liệu gốc được lưu nguyên văn, có mã băm) ─────────
export type RawFileRow = { id: string; resultId: string; name: string; size: number; sha256: string; uploadedBy: string; uploadedAt: string };

export async function saveRawFile(resultId: string, file: { name: string; content: string }, actor: string) {
  const { createHash } = await import("crypto");
  const sha256 = createHash("sha256").update(file.content, "utf8").digest("hex");
  const size = Buffer.byteLength(file.content, "utf8");
  const [row] = await dbQuery(
    `insert into public.raw_data_files (result_id, name, size, sha256, content, uploaded_by)
     values ($1, $2, $3, $4, $5, $6) returning id, uploaded_at`,
    [resultId, file.name.slice(0, 200), size, sha256, file.content, actor],
  );
  await dbQuery(
    `update public.analysis_results set raw_files = coalesce(raw_files, '[]'::jsonb) || $2::jsonb where id = $1`,
    [resultId, JSON.stringify([{ id: row.id, name: file.name, kind: "CSV raw", size: `${(size / 1024).toFixed(1)} KB`, uploadedAt: row.uploaded_at, uploadedBy: actor, hash: sha256 }])],
  );
  return { id: row.id as string, sha256 };
}

export async function getRawFile(id: string) {
  const [r] = await dbQuery(`select id, result_id, name, size, sha256, content, uploaded_by, uploaded_at from public.raw_data_files where id = $1`, [id]);
  return r ? { id: r.id as string, name: r.name as string, sha256: r.sha256 as string, content: r.content as string } : null;
}
