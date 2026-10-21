// M4.4 Quản trị nhiệm vụ KH&CN – quy tắc thuần (vòng đời, chống trùng lặp, tiến độ, kinh phí), kiểm thử được.

export const TASK_KINDS = ["Đề tài", "Dự án", "Dự án SXTN", "Nhiệm vụ thường xuyên", "Hợp tác quốc tế"] as const;
export const TASK_LEVELS = ["Cấp quốc gia", "Cấp bộ", "Cấp tỉnh", "Cấp cơ sở", "Hợp tác"] as const;
export const RESEARCH_FIELDS = [
  "Trồng trọt",
  "Chăn nuôi – thú y",
  "Thủy sản",
  "Lâm nghiệp",
  "Đất – phân bón",
  "Bảo vệ thực vật",
  "Công nghệ sinh học",
  "Cơ điện – sau thu hoạch",
  "Kinh tế – chính sách",
  "Khác",
] as const;
export const TASK_STATUSES = [
  "Đề xuất",
  "Đang xét duyệt",
  "Được phê duyệt",
  "Đang thực hiện",
  "Chờ nghiệm thu",
  "Đã nghiệm thu",
  "Không phê duyệt",
  "Dừng",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const ACCEPTANCE_RESULTS = ["Xuất sắc", "Khá", "Đạt", "Không đạt"] as const;
export const MEMBER_ROLES = ["Chủ nhiệm", "Thư ký", "Thành viên chính", "Thành viên", "Kỹ thuật viên"] as const;
export const EXPENSE_CATEGORIES = ["Nhân công", "Vật tư – hóa chất", "Thiết bị", "Thuê khoán", "Hội thảo", "Công tác phí", "Quản lý", "Khác"] as const;
export const FUND_SOURCES = ["Ngân sách nhà nước", "Nguồn khác"] as const;
export const DEGREES = ["Tiến sĩ", "Thạc sĩ", "Kỹ sư / Cử nhân", "Cao đẳng", "Khác"] as const;
export const ACADEMIC_TITLES = ["", "Giáo sư", "Phó giáo sư"] as const;
export const RESEARCHER_STATUSES = ["Đang công tác", "Cộng tác", "Nghỉ hưu / chuyển công tác"] as const;
export const TRIAL_DESIGNS = ["Khối ngẫu nhiên đầy đủ (RCBD)", "Hoàn toàn ngẫu nhiên (CRD)", "Ô lớn – ô nhỏ (Split-plot)", "Ô vuông Latin", "Khác"] as const;
export const FIELD_TRIAL_STATUSES = ["Đang bố trí", "Đang theo dõi", "Đã thu hoạch", "Đã xử lý số liệu", "Hủy"] as const;

/** Trạng thái từ khi có quyết định phê duyệt trở đi. */
const APPROVED: string[] = ["Được phê duyệt", "Đang thực hiện", "Chờ nghiệm thu", "Đã nghiệm thu"];
/** Nhiệm vụ đang triển khai (tính tiến độ, cảnh báo). */
export const ACTIVE_TASK: string[] = ["Được phê duyệt", "Đang thực hiện", "Chờ nghiệm thu"];

/** Kiểm tra hồ sơ đủ điều kiện cho trạng thái đang chọn; trả lỗi tiếng Việt hoặc null. */
export function validateTask(t: {
  status: string;
  approvalNo: string;
  approvedAt: string;
  acceptanceResult: string;
  acceptedAt: string;
  startAt: string;
  endAt: string;
}) {
  if (!(TASK_STATUSES as readonly string[]).includes(t.status)) return "Trạng thái không hợp lệ";
  if (t.startAt && t.endAt && t.endAt < t.startAt) return "Ngày kết thúc phải sau ngày bắt đầu";
  if (APPROVED.includes(t.status) && (!t.approvalNo || !t.approvedAt)) return "Cần số và ngày quyết định phê duyệt trước khi chuyển sang trạng thái này";
  if (t.status === "Đã nghiệm thu" && (!t.acceptanceResult || !t.acceptedAt)) return "Cần kết quả và ngày nghiệm thu";
  if (t.acceptanceResult && !(ACCEPTANCE_RESULTS as readonly string[]).includes(t.acceptanceResult)) return "Kết quả nghiệm thu không hợp lệ";
  return null;
}

// ── Chống trùng lặp ─────────────────────────────────────────────────

/** Bỏ dấu tiếng Việt, chữ thường, chỉ giữ chữ – số. */
export function normalizeVi(s: string) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Từ xuất hiện ở hầu hết tên đề tài trong tỉnh – không mang nghĩa phân biệt.
const STOPWORDS = new Set(
  "nghien cuu ung dung xay dung phat trien danh gia giai phap mo hinh thu nghiem hoan thien quy trinh cong nghe ky thuat san xuat tai tren dia ban tinh thanh hoa huyen xa va cua cho cac nhung mot so de trong voi theo ve nham tu den giai doan nam".split(
    " ",
  ),
);

export function tokens(s: string) {
  return new Set(normalizeVi(s).split(" ").filter((w) => w.length > 1 && !STOPWORDS.has(w)));
}

/** Hệ số Dice của 2 tập từ (0–1). */
export function dice(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return (2 * common) / (a.size + b.size);
}

/** Độ giống nhau giữa 2 nhiệm vụ: tên (70%) + từ khóa (30%); thiếu từ khóa ở một bên → chỉ so tên + từ khóa gộp. */
export function similarity(a: { title: string; keywords?: string }, b: { title: string; keywords?: string }) {
  const ta = tokens(a.title), tb = tokens(b.title);
  if (a.keywords && b.keywords) return Math.round((0.7 * dice(ta, tb) + 0.3 * dice(tokens(a.keywords), tokens(b.keywords))) * 100) / 100;
  return Math.round(dice(tokens(`${a.title} ${a.keywords ?? ""}`), tokens(`${b.title} ${b.keywords ?? ""}`)) * 100) / 100;
}

export const DUPLICATE_THRESHOLDS = { high: 0.5, review: 0.3 } as const;

export function duplicateLevel(score: number) {
  return score >= DUPLICATE_THRESHOLDS.high ? "Nghi trùng cao" : score >= DUPLICATE_THRESHOLDS.review ? "Cần xem xét" : "";
}

/** Các mục giống nhất (điểm ≥ ngưỡng xem xét), sắp giảm dần. */
export function findDuplicates<T extends { id: string; title: string; keywords?: string }>(
  query: { title: string; keywords?: string },
  candidates: T[],
  opts: { excludeId?: string; limit?: number } = {},
) {
  return candidates
    .filter((c) => c.id !== opts.excludeId)
    .map((c) => ({ item: c, score: similarity(query, c) }))
    .filter((x) => x.score >= DUPLICATE_THRESHOLDS.review)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 10);
}

// ── Tiến độ, kinh phí, cảnh báo ─────────────────────────────────────

/** Tiến độ theo mốc: % mốc đã hoàn thành, số mốc trễ hạn tại `today`. */
export function milestoneProgress(ms: { dueAt: string; doneAt: string }[], today: string) {
  const done = ms.filter((m) => m.doneAt).length;
  const overdue = ms.filter((m) => !m.doneAt && m.dueAt && m.dueAt < today).length;
  return { total: ms.length, done, overdue, pct: ms.length ? Math.round((done / ms.length) * 100) : 0 };
}

/** Kinh phí: tổng được duyệt, đã giải ngân, còn lại, % giải ngân. */
export function budgetSummary(t: { budgetState: number; budgetOther: number }, expenses: { amount: number }[]) {
  const total = (Number(t.budgetState) || 0) + (Number(t.budgetOther) || 0);
  const spent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  return { total, spent, remaining: total - spent, pct: total > 0 ? Math.round((spent / total) * 100) : 0 };
}

export type TaskAlert = { kind: "Mốc trễ hạn" | "Quá hạn kết thúc" | "Sắp kết thúc" | "Vượt kinh phí"; detail: string };

export function taskAlerts(
  t: { status: string; endAt: string; budgetState: number; budgetOther: number },
  ms: { dueAt: string; doneAt: string }[],
  expenses: { amount: number }[],
  today: string,
): TaskAlert[] {
  if (!ACTIVE_TASK.includes(t.status)) return [];
  const out: TaskAlert[] = [];
  const p = milestoneProgress(ms, today);
  if (p.overdue) out.push({ kind: "Mốc trễ hạn", detail: `${p.overdue} mốc` });
  if (t.endAt) {
    const days = Math.round((Date.parse(t.endAt) - Date.parse(today)) / 86_400_000);
    if (days < 0 && t.status !== "Chờ nghiệm thu") out.push({ kind: "Quá hạn kết thúc", detail: `${-days} ngày` });
    else if (days >= 0 && days <= 30 && t.status === "Đang thực hiện") out.push({ kind: "Sắp kết thúc", detail: `còn ${days} ngày` });
  }
  const b = budgetSummary(t, expenses);
  if (b.total > 0 && b.spent > b.total) out.push({ kind: "Vượt kinh phí", detail: `${b.pct}%` });
  return out;
}
