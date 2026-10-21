// Kiểm soát trước phát hành kết quả (M2.5, M2.7, M2.2 · ISO/IEC 17025:2017 §6.2, §6.4, §6.5, §7.2, §7.7, §7.8.6).
// Hàm thuần (không truy cập DB) để kiểm thử được – dữ liệu do lớp gọi nạp sẵn.
import { REJECT_RULES, detectViolations } from "@/lib/westgard";
import type { AccreditedTest } from "@/lib/accreditation";
import type { QCPoint } from "@/lib/mock-data";

export type Level = "Chặn" | "Cảnh báo" | "Tắt";
export const LEVELS: Level[] = ["Chặn", "Cảnh báo", "Tắt"];

export type ReleaseRules = {
  equipmentCalibration: Level;
  technicianAuthorization: Level;
  approverAuthorization: Level;
  methodValidationInHouse: Level;
  methodValidationStandard: Level;
  belowLoq: Level;
  outOfRange: Level;
  rsd: { level: Level; max: number };
  recovery: { level: Level; min: number; max: number };
  qcWestgard: Level;
  crmExpired: Level;
  inconclusive: Level;
  uncertaintyMissing: Level;
};

/** Phiên bản mặc định ban đầu – PTN xem xét và phê duyệt phiên bản của mình. */
export const DEFAULT_RULES: ReleaseRules = {
  equipmentCalibration: "Chặn",
  technicianAuthorization: "Chặn",
  approverAuthorization: "Chặn",
  methodValidationInHouse: "Chặn",
  methodValidationStandard: "Cảnh báo",
  belowLoq: "Cảnh báo",
  outOfRange: "Chặn",
  rsd: { level: "Cảnh báo", max: 5 },
  recovery: { level: "Cảnh báo", min: 90, max: 110 },
  qcWestgard: "Chặn",
  crmExpired: "Chặn",
  inconclusive: "Cảnh báo",
  uncertaintyMissing: "Chặn",
};

/** Mô tả từng quy tắc (thứ tự hiển thị). */
export const RULE_INFO: { key: keyof ReleaseRules; label: string; clause: string }[] = [
  { key: "equipmentCalibration", label: "Thiết bị quá hạn hiệu chuẩn hoặc không ở trạng thái Hoạt động (tự khóa thiết bị)", clause: "§6.4.4" },
  { key: "technicianAuthorization", label: "KTV chưa được ủy quyền thực hiện phép thử", clause: "§6.2.6" },
  { key: "approverAuthorization", label: "Người phê duyệt chưa được ủy quyền phê duyệt & ký phiếu cho phép thử", clause: "§6.2.6, §7.8.1" },
  { key: "methodValidationInHouse", label: "Phương pháp nội bộ (AEMD-HD) chưa có hồ sơ xác nhận giá trị sử dụng Đạt", clause: "§7.2.2" },
  { key: "methodValidationStandard", label: "Phương pháp tiêu chuẩn chưa có hồ sơ kiểm tra xác nhận Đạt", clause: "§7.2.1.5" },
  { key: "belowLoq", label: "Kết quả dưới giới hạn định lượng (LOQ) – báo cáo dạng \"< LOQ\"", clause: "M2.5" },
  { key: "outOfRange", label: "Kết quả ngoài phạm vi đo được công nhận", clause: "M2.5" },
  { key: "rsd", label: "Độ lặp lại RSD vượt tiêu chí chấp nhận", clause: "§7.7.1" },
  { key: "recovery", label: "Độ thu hồi ngoài khoảng chấp nhận", clause: "§7.7.1" },
  { key: "qcWestgard", label: "Biểu đồ kiểm soát vi phạm quy tắc loại bỏ Westgard (1-3s, 2-2s) tại thời điểm phân tích", clause: "§7.7.1" },
  { key: "crmExpired", label: "Mẫu chuẩn / CRM hết hạn sử dụng tại thời điểm phân tích", clause: "§6.5" },
  { key: "inconclusive", label: "Kết luận Vô định (kết quả nằm trong vùng guard band)", clause: "§7.8.6" },
  { key: "uncertaintyMissing", label: "Áp dụng quy tắc có guard band nhưng thiếu độ không đảm bảo đo U", clause: "§7.6, §7.8.6" },
];

export const levelOf = (rules: ReleaseRules, key: keyof ReleaseRules): Level => {
  const v = rules[key];
  return typeof v === "string" ? v : v.level;
};

// ── Dữ liệu đầu vào ─────────────────────────────────────────────────
export type CheckInput = {
  result: {
    criterion: string; // "#12 …" khi chọn từ danh mục VILAS
    unit: string;
    mean: number;
    rsd: number;
    uncertainty: number;
    matrixSpikeRecovery: number;
    instrumentCode: string;
    referenceMaterial: string;
    technician: string;
    startedAt: string;
    decisionRuleType: string;
    conclusion: string;
  };
  test?: AccreditedTest;
  equipment: { code: string; name: string; status: string; nextCalibration: string }[];
  authorizations: { staffName: string; testNo: number; role: string; active: boolean }[];
  validations: { testNo: number; conclusion: string }[];
  qcCharts: { criterion: string; method: string; mean: number; sd: number; points: QCPoint[] }[];
  chemicals: { name: string; expiry: string }[];
  approverName?: string;
};

export type CheckStatus = "Đạt" | "Chặn" | "Cảnh báo" | "Không áp dụng";
export type CheckResult = { key: keyof ReleaseRules; label: string; status: CheckStatus; message: string };

// ── Giới hạn định lượng / phạm vi đo ─────────────────────────────────
const normUnit = (u: string) => u.toLowerCase().replace(/\s+/g, "").replace("μ", "µ");
const toNum = (s: string) => Number(s.replace(",", "."));

export type Loq = { kind: "min"; value: number; unit: string } | { kind: "range"; lo: number; hi: number };

/** "0,25 mg/kg" → {min 0.25 mg/kg} · "2,0 ~ 10,0" → {range 2..10} · "" → null. */
export function parseLoq(loq: string): Loq | null {
  const s = (loq ?? "").trim();
  if (!s) return null;
  const range = /^\(?\s*(\d+(?:[.,]\d+)?)\s*~\s*(\d+(?:[.,]\d+)?)\s*\)?$/.exec(s);
  if (range) return { kind: "range", lo: toNum(range[1]), hi: toNum(range[2]) };
  // Chỉ nhận LOQ bắt đầu bằng con số – bỏ qua dạng nhiều thành phần "K: 0,1 · Na: …".
  const m = /^(\d+(?:[.,]\d+)?)\s*(%|[a-zA-Zµμ]+\(?\+?\)?\/[a-zA-Z0-9]+|[a-zA-Zµμ]+\/[a-zA-Z0-9]+|[a-zA-Zµμ]+)?/.exec(s);
  if (!m) return null;
  return { kind: "min", value: toNum(m[1]), unit: m[2] ? normUnit(m[2]) : "" };
}

/** Giá trị báo cáo: "< LOQ" khi dưới LOQ cùng đơn vị. */
export function belowLoq(mean: number, unit: string, loq: Loq | null) {
  return Boolean(loq && loq.kind === "min" && loq.unit && loq.unit === normUnit(unit) && mean < loq.value);
}

// ── Đánh giá ────────────────────────────────────────────────────────
const day = (iso: string) => (iso ?? "").slice(0, 10);

export function evaluateRelease(rules: ReleaseRules, input: CheckInput): CheckResult[] {
  const out: CheckResult[] = [];
  const { result: r, test } = input;
  const analysisDay = day(r.startedAt) || new Date().toISOString().slice(0, 10);
  const push = (key: keyof ReleaseRules, failed: boolean | null, message: string) => {
    const level = levelOf(rules, key);
    const label = RULE_INFO.find((x) => x.key === key)!.label;
    if (level === "Tắt") return;
    out.push({ key, label, status: failed === null ? "Không áp dụng" : failed ? level : "Đạt", message });
  };

  // Thiết bị
  const eq = input.equipment.find((e) => e.code === r.instrumentCode);
  if (!r.instrumentCode) push("equipmentCalibration", null, "Chưa ghi thiết bị sử dụng");
  else if (!eq) push("equipmentCalibration", true, `Không tìm thấy thiết bị ${r.instrumentCode}`);
  else if (eq.status !== "Hoạt động") push("equipmentCalibration", true, `${eq.code} đang ở trạng thái "${eq.status}"`);
  else if (!eq.nextCalibration) push("equipmentCalibration", null, `${eq.code} chưa nhập lịch hiệu chuẩn`);
  else if (day(eq.nextCalibration) < analysisDay) push("equipmentCalibration", true, `${eq.code} quá hạn hiệu chuẩn từ ${day(eq.nextCalibration)}`);
  else push("equipmentCalibration", false, `${eq.code} còn hạn hiệu chuẩn đến ${day(eq.nextCalibration)}`);

  // Ủy quyền
  const authorized = (name: string, role: string) =>
    Boolean(test) && input.authorizations.some((a) => a.active && a.staffName === name && a.testNo === test!.no && a.role === role);
  if (!test) push("technicianAuthorization", null, "Chỉ tiêu ngoài danh mục VILAS – không kiểm tra ủy quyền");
  else push("technicianAuthorization", !authorized(r.technician, "Thực hiện phép thử"),
    authorized(r.technician, "Thực hiện phép thử") ? `${r.technician} được ủy quyền thực hiện #${test.no}` : `${r.technician} chưa được ủy quyền thực hiện #${test.no}`);
  if (input.approverName !== undefined) {
    if (!test) push("approverAuthorization", null, "Chỉ tiêu ngoài danh mục VILAS");
    else {
      const ok = authorized(input.approverName, "Phê duyệt & ký phiếu kết quả");
      push("approverAuthorization", !ok, ok ? `${input.approverName} được ủy quyền phê duyệt #${test.no}` : `${input.approverName} chưa được ủy quyền phê duyệt #${test.no}`);
    }
  }

  // Xác nhận phương pháp
  if (test) {
    const inHouse = test.method.startsWith("AEMD-");
    const ok = input.validations.some((v) => v.testNo === test.no && v.conclusion === "Đạt");
    push(inHouse ? "methodValidationInHouse" : "methodValidationStandard", !ok,
      ok ? "Có hồ sơ xác nhận phương pháp Đạt" : `Chưa có hồ sơ ${inHouse ? "xác nhận giá trị sử dụng" : "kiểm tra xác nhận"} Đạt cho #${test.no}`);
  }

  // LOQ & phạm vi đo
  const loq = parseLoq(test?.loq ?? "");
  if (!Number.isFinite(r.mean)) {
    push("belowLoq", null, "Chưa có giá trị đo");
  } else if (!loq) {
    push("belowLoq", null, "Phép thử không công bố LOQ");
  } else if (loq.kind === "range") {
    const out_ = r.mean < loq.lo || r.mean > loq.hi;
    push("outOfRange", out_, out_ ? `${r.mean} ngoài phạm vi đo ${loq.lo} – ${loq.hi}` : `Trong phạm vi đo ${loq.lo} – ${loq.hi}`);
  } else if (!loq.unit || loq.unit !== normUnit(r.unit)) {
    push("belowLoq", null, `Đơn vị kết quả "${r.unit}" khác đơn vị LOQ "${test?.loq}" – không so sánh tự động`);
  } else {
    const below = r.mean < loq.value;
    push("belowLoq", below, below ? `${r.mean} < LOQ ${loq.value} ${loq.unit} – báo cáo "< ${loq.value}"` : `≥ LOQ ${loq.value} ${loq.unit}`);
  }

  // Độ lặp lại, độ thu hồi
  if (Number.isFinite(r.rsd)) push("rsd", r.rsd > rules.rsd.max, `RSD ${r.rsd}% (tiêu chí ≤ ${rules.rsd.max}%)`);
  if (Number.isFinite(r.matrixSpikeRecovery)) {
    const { min, max } = rules.recovery;
    push("recovery", r.matrixSpikeRecovery < min || r.matrixSpikeRecovery > max, `Độ thu hồi ${r.matrixSpikeRecovery}% (chấp nhận ${min}–${max}%)`);
  } else push("recovery", null, "Không nhập độ thu hồi");

  // QC – biểu đồ kiểm soát cùng phương pháp, điểm gần nhất ≤ ngày phân tích
  const method = test?.method.replace(/\s*\(Ref:.*\)$/, "") ?? "";
  const chart = input.qcCharts.find((c) => method && c.method.includes(method));
  if (!chart) push("qcWestgard", null, "Không có biểu đồ kiểm soát cho phương pháp này");
  else {
    const pts = chart.points.filter((p) => day(p.date) <= analysisDay).sort((a, b) => a.date.localeCompare(b.date));
    const last = detectViolations(pts, chart.mean, chart.sd).at(-1);
    const bad = last?.flags.filter((f) => REJECT_RULES.includes(f)) ?? [];
    push("qcWestgard", last ? bad.length > 0 : null,
      !last ? "Chưa có điểm QC trước ngày phân tích" : bad.length ? `Điểm QC ${day(last.date)} vi phạm ${bad.join(", ")}` : `Điểm QC ${day(last.date)} trong kiểm soát`);
  }

  // CRM
  if (!r.referenceMaterial) push("crmExpired", null, "Không ghi mẫu chuẩn / CRM");
  else {
    const crm = input.chemicals.find((c) => c.name === r.referenceMaterial);
    if (!crm || !crm.expiry) push("crmExpired", null, "CRM chưa nhập hạn dùng");
    else {
      const expired = day(crm.expiry) < analysisDay;
      push("crmExpired", expired, expired ? `CRM hết hạn từ ${day(crm.expiry)}` : `CRM còn hạn đến ${day(crm.expiry)}`);
    }
  }

  // Kết luận / U
  const guarded = r.decisionRuleType.startsWith("Guarded");
  push("uncertaintyMissing", guarded ? !Number.isFinite(r.uncertainty) : null,
    guarded ? (Number.isFinite(r.uncertainty) ? `U = ${r.uncertainty}` : "Quy tắc guard band cần U của kết quả") : "Không áp dụng guard band");
  push("inconclusive", r.conclusion === "Vô định", r.conclusion === "Vô định" ? "Kết luận Vô định – cần thỏa thuận với khách hàng hoặc phân tích lại" : `Kết luận: ${r.conclusion}`);

  return out;
}

export const blockers = (checks: CheckResult[]) => checks.filter((c) => c.status === "Chặn");
export const warnings = (checks: CheckResult[]) => checks.filter((c) => c.status === "Cảnh báo");
