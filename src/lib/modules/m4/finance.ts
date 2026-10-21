// Tính toán tài chính & quy tắc nghiệp vụ M4.2 (hàm thuần, kiểm thử được).

/** Tổng báo giá sau thuế, làm tròn đến đồng. */
export const quotationTotal = (amount: number, vatRate: number) =>
  Math.round((Number(amount) || 0) * (1 + (Number(vatRate) || 0) / 100));

/** Số đã thu và công nợ còn lại của từng hợp đồng. */
export function contractBalances(
  contracts: { id: string; value: number }[],
  payments: { contractId: string; amount: number }[],
) {
  const paid = new Map<string, number>();
  for (const p of payments) {
    if (!p.contractId) continue;
    paid.set(p.contractId, (paid.get(p.contractId) ?? 0) + (Number(p.amount) || 0));
  }
  return new Map(
    contracts.map((c) => {
      const got = paid.get(c.id) ?? 0;
      return [c.id, { paid: got, debt: Math.max(0, (Number(c.value) || 0) - got) }];
    }),
  );
}

export const fmtVND = (v: number) => `${Math.round(Number(v) || 0).toLocaleString("vi-VN")} đ`;

// ── Định mức & dòng báo giá ─────────────────────────────────────────

export type CostNorm = { costMaterials: number; costLabor: number; costDepreciation: number; costOverhead: number };

/** Giá thành định mức / đơn vị = vật tư + nhân công + khấu hao + quản lý. */
export const unitCostOf = (n: CostNorm) =>
  (Number(n.costMaterials) || 0) + (Number(n.costLabor) || 0) + (Number(n.costDepreciation) || 0) + (Number(n.costOverhead) || 0);

/** Tỷ suất lợi nhuận trên doanh thu (%), 1 chữ số thập phân; chưa có giá hoặc chưa có định mức → null. */
export function marginPct(revenue: number, cost: number) {
  const r = Number(revenue) || 0;
  if (r <= 0 || !(Number(cost) > 0)) return null;
  return Math.round(((r - cost) / r) * 1000) / 10;
}

export type LineInput = { quantity: number; unitPrice: number; discountPct: number; unitCost?: number };

/** Thành tiền 1 dòng (chưa thuế) sau giảm giá, làm tròn đồng. */
export const lineAmount = (l: LineInput) =>
  Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - Math.min(100, Math.max(0, Number(l.discountPct) || 0)) / 100));

/** Cộng các dòng: doanh thu chưa thuế + giá thành định mức. */
export function linesSummary(lines: LineInput[]) {
  const amount = lines.reduce((s, l) => s + lineAmount(l), 0);
  const cost = Math.round(lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0));
  return { amount, cost, margin: marginPct(amount, cost) };
}

// ── Quy trình báo giá (phê duyệt) ───────────────────────────────────

export const QUOTATION_STATUSES = ["Nháp", "Chờ duyệt", "Đã duyệt", "Đã gửi", "Được chấp nhận", "Từ chối", "Hết hạn"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_ACTIONS = {
  submit: "Trình duyệt",
  approve: "Duyệt",
  return: "Trả lại để sửa",
  send: "Đã gửi khách",
  accept: "Khách chấp nhận",
  decline: "Khách từ chối",
  expire: "Hết hạn",
  reopen: "Mở lại thành nháp",
} as const;
export type QuotationAction = keyof typeof QUOTATION_ACTIONS;

const FLOW: Record<QuotationAction, { from: QuotationStatus[]; to: QuotationStatus }> = {
  submit: { from: ["Nháp"], to: "Chờ duyệt" },
  approve: { from: ["Chờ duyệt"], to: "Đã duyệt" },
  return: { from: ["Chờ duyệt", "Đã duyệt"], to: "Nháp" },
  send: { from: ["Đã duyệt"], to: "Đã gửi" },
  accept: { from: ["Đã gửi"], to: "Được chấp nhận" },
  decline: { from: ["Đã gửi"], to: "Từ chối" },
  expire: { from: ["Đã gửi"], to: "Hết hạn" },
  reopen: { from: ["Từ chối", "Hết hạn"], to: "Nháp" },
};

/** Các bước được phép từ trạng thái hiện tại. */
export const allowedActions = (status: string) =>
  (Object.keys(FLOW) as QuotationAction[]).filter((a) => (FLOW[a].from as string[]).includes(status));

/**
 * Chuyển trạng thái báo giá. Tách nhiệm vụ: người trình không tự duyệt; duyệt / trả lại cần quyền phê duyệt.
 * Trả về trạng thái mới hoặc lỗi tiếng Việt.
 */
export function nextQuotationStatus(
  q: { status: string; amount: number; submittedBy: string },
  action: string,
  ctx: { actorEmail: string; canApprove: boolean },
): { to: QuotationStatus } | { error: string } {
  if (!(action in FLOW)) return { error: "Thao tác không hợp lệ" };
  const step = FLOW[action as QuotationAction];
  if (!(step.from as string[]).includes(q.status)) return { error: `Không thể "${QUOTATION_ACTIONS[action as QuotationAction]}" khi báo giá đang ở trạng thái ${q.status}` };
  if (action === "submit" && !(Number(q.amount) > 0)) return { error: "Báo giá chưa có giá trị – thêm dòng dịch vụ trước khi trình duyệt" };
  if (action === "approve" || action === "return") {
    if (!ctx.canApprove) return { error: "Bạn không có quyền phê duyệt báo giá" };
    if (action === "approve" && q.submittedBy && q.submittedBy.toLowerCase() === ctx.actorEmail.toLowerCase()) {
      return { error: "Người trình duyệt không được tự duyệt báo giá của mình" };
    }
  }
  return { to: step.to };
}

/** Báo giá đã khóa giá trị (không sửa dòng / số tiền) từ khi trình duyệt. */
export const quotationLocked = (status: string) => status !== "Nháp";

// ── Thời hạn, cảnh báo, công nợ ─────────────────────────────────────

export const AGING_BUCKETS = ["Trong hạn", "1–30 ngày", "31–60 ngày", "61–90 ngày", "> 90 ngày"] as const;

/** Nhóm tuổi nợ theo số ngày quá hạn thanh toán (≤ 0 hoặc chưa đặt hạn → trong hạn). */
export function agingBucket(daysOverdue: number): (typeof AGING_BUCKETS)[number] {
  if (!(daysOverdue > 0)) return "Trong hạn";
  if (daysOverdue <= 30) return "1–30 ngày";
  if (daysOverdue <= 60) return "31–60 ngày";
  if (daysOverdue <= 90) return "61–90 ngày";
  return "> 90 ngày";
}

/** Số ngày từ `from` đến `to` ("YYYY-MM-DD"); thiếu ngày → NaN. */
export function daysBetween(from: string, to: string) {
  if (!from || !to) return NaN;
  return Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / 86_400_000);
}

export type ContractAlert = { kind: "Trễ trả kết quả" | "Sắp đến hạn trả kết quả" | "Quá hạn thanh toán" | "Sắp hết hạn hợp đồng"; days: number };

const ACTIVE_CONTRACT = ["Đã ký", "Đang thực hiện", "Đã nghiệm thu"];

/** Cảnh báo của 1 hợp đồng tại ngày `today`. */
export function contractAlerts(
  c: { status: string; resultDueAt: string; deliveredAt: string; paymentDueAt: string; endAt: string },
  debt: number,
  today: string,
  warnDays = 3,
): ContractAlert[] {
  if (!ACTIVE_CONTRACT.includes(c.status)) return [];
  const out: ContractAlert[] = [];
  const toResult = daysBetween(today, c.resultDueAt);
  if (!c.deliveredAt && Number.isFinite(toResult)) {
    if (toResult < 0) out.push({ kind: "Trễ trả kết quả", days: -toResult });
    else if (toResult <= warnDays) out.push({ kind: "Sắp đến hạn trả kết quả", days: toResult });
  }
  const toPay = daysBetween(today, c.paymentDueAt);
  if (debt > 0 && toPay < 0) out.push({ kind: "Quá hạn thanh toán", days: -toPay });
  const toEnd = daysBetween(today, c.endAt);
  if (c.status !== "Đã nghiệm thu" && Number.isFinite(toEnd) && toEnd >= 0 && toEnd <= warnDays * 2) out.push({ kind: "Sắp hết hạn hợp đồng", days: toEnd });
  return out;
}

// ── Số chứng từ, báo cáo ────────────────────────────────────────────

/** Số kế tiếp dạng <tiền tố>-<năm>-<3 chữ số> từ các số đã có (bỏ qua số khác định dạng). */
export function nextDocCode(prefix: string, year: number, existing: string[]) {
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const max = existing.reduce((m, c) => Math.max(m, Number(re.exec(c)?.[1] ?? 0)), 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
}

/** "YYYY-MM" của 12 tháng trong năm. */
export const monthsOf = (year: number) => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

/** Cộng giá trị theo tháng "YYYY-MM" của trường ngày. */
export function sumByMonth<T>(items: T[], date: (x: T) => string, value: (x: T) => number, months: string[]) {
  const m = new Map(months.map((k) => [k, 0]));
  for (const x of items) {
    const k = (date(x) || "").slice(0, 7);
    if (m.has(k)) m.set(k, m.get(k)! + (Number(value(x)) || 0));
  }
  return months.map((k) => m.get(k)!);
}

/** Dòng CSV an toàn: bọc ngoặc kép, chặn công thức Excel (=, +, -, @ ở đầu). */
export function csvRow(cells: (string | number)[]) {
  return cells
    .map((c) => {
      let s = String(c ?? "");
      if (/^[=+\-@]/.test(s) && typeof c === "string") s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    })
    .join(",");
}

// ── Đọc số tiền bằng chữ ────────────────────────────────────────────

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

/** Đọc nhóm 3 chữ số; `full` = phải đọc "không trăm" (không phải nhóm đầu). */
function read3(n: number, full: boolean) {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10;
  const out: string[] = [];
  if (h > 0 || full) out.push(DIGITS[h], "trăm");
  if (t === 0) {
    if (u > 0) {
      if (h > 0 || full) out.push("linh");
      out.push(DIGITS[u]);
    }
  } else if (t === 1) {
    out.push("mười");
    if (u === 5) out.push("lăm");
    else if (u > 0) out.push(DIGITS[u]);
  } else {
    out.push(DIGITS[t], "mươi");
    if (u === 1) out.push("mốt");
    else if (u === 4) out.push("tư");
    else if (u === 5) out.push("lăm");
    else if (u > 0) out.push(DIGITS[u]);
  }
  return out.join(" ");
}

function readNumber(n: number, leading: boolean): string {
  if (n >= 1e9) {
    const lo = n % 1e9;
    const s = `${readNumber(Math.floor(n / 1e9), leading)} tỷ`;
    return lo > 0 ? `${s} ${readNumber(lo, false)}` : s;
  }
  const groups = [Math.floor(n / 1e6), Math.floor(n / 1e3) % 1000, n % 1000];
  const units = [" triệu", " nghìn", ""];
  const parts: string[] = [];
  let first = leading;
  groups.forEach((g, i) => {
    if (g === 0) return;
    parts.push(read3(g, !first) + units[i]);
    first = false;
  });
  return parts.join(" ");
}

/** 1250000 → "Một triệu hai trăm năm mươi nghìn đồng". */
export function vndInWords(amount: number) {
  const n = Math.round(Math.abs(Number(amount) || 0));
  const s = n === 0 ? "không" : readNumber(n, true);
  return `${amount < 0 ? "Âm " + s : s.charAt(0).toUpperCase() + s.slice(1)} đồng`;
}
