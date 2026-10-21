// Màn hình làm việc M4 – hộp thư yêu cầu, bảng giao dịch, Gantt nhiệm vụ (hàm thuần, kiểm thử được).
import { normalizePhone } from "./portal";
import { nextDocCode } from "./finance";

// ── Hộp thư yêu cầu ─────────────────────────────────────────────────
export const INBOX_BOXES = [
  { key: "new", label: "Mới tiếp nhận", statuses: ["Mới tiếp nhận"] },
  { key: "doing", label: "Đang xử lý", statuses: ["Đang xử lý"] },
  { key: "quoted", label: "Báo giá & thực hiện", statuses: ["Đã báo giá", "Đang thực hiện"] },
  { key: "closed", label: "Đã đóng", statuses: ["Hoàn thành", "Từ chối"] },
] as const;
export type InboxBox = (typeof INBOX_BOXES)[number]["key"];

export const boxOf = (status: string): InboxBox =>
  INBOX_BOXES.find((b) => (b.statuses as readonly string[]).includes(status))?.key ?? "doing";

export const parseBox = (v: string | undefined): InboxBox | "all" =>
  v === "all" ? "all" : (INBOX_BOXES.find((b) => b.key === v)?.key ?? "new");

const norm = (s: string) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/** Khách hàng sẵn có khớp yêu cầu: trùng số điện thoại, nếu không thì trùng tên tổ chức / người liên hệ. */
export function matchCustomer<C extends { id: string; name: string; phone: string }>(
  r: { phone: string; orgName: string; contactName: string },
  customers: C[],
): C | null {
  const phone = normalizePhone(r.phone);
  if (phone) {
    const byPhone = customers.find((c) => c.phone && normalizePhone(c.phone) === phone);
    if (byPhone) return byPhone;
  }
  const names = [r.orgName, r.contactName].map(norm).filter(Boolean);
  return customers.find((c) => names.includes(norm(c.name))) ?? null;
}

/** Hồ sơ khách hàng mới lập từ yêu cầu (mã KH-<năm>-<số>). */
export function customerDraft(
  r: { orgName: string; contactName: string; phone: string; address: string },
  existingCodes: string[],
  year: number,
) {
  const org = r.orgName.trim();
  return {
    code: nextDocCode("KH", year, existingCodes),
    name: org || r.contactName.trim(),
    kind: (org ? "Doanh nghiệp" : "Nông hộ") as "Doanh nghiệp" | "Nông hộ",
    contact: org ? r.contactName.trim() : "",
    phone: normalizePhone(r.phone),
    address: r.address.trim(),
  };
}

/** Báo giá nháp lập từ yêu cầu: tiêu đề theo loại dịch vụ + trích nội dung, hiệu lực 30 ngày. */
export function quotationDraft(
  r: { code: string; kind: string; description: string; sampleCount: number },
  customerId: string,
  today: string,
  validDays = 30,
) {
  const brief = r.description.replace(/\s+/g, " ").trim();
  const clip = brief.length > 80 ? `${brief.slice(0, 79)}…` : brief;
  return {
    customerId,
    title: `${r.kind}${r.sampleCount > 0 ? ` (${r.sampleCount} mẫu)` : ""}: ${clip}`,
    issuedAt: today,
    validUntil: new Date(Date.parse(today) + validDays * 86_400_000).toISOString().slice(0, 10),
    note: `Lập từ yêu cầu ${r.code}`,
  };
}

// ── Gantt nhiệm vụ ──────────────────────────────────────────────────
const DAY = 86_400_000;
const t = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

/** Khung thời gian Gantt từ đầu năm `from` đến hết năm `to`; mỗi tháng một cột (vị trí theo %). */
export function ganttWindow(fromYear: number, toYear: number) {
  const start = `${fromYear}-01-01`;
  const end = `${toYear + 1}-01-01`; // mốc loại trừ
  const span = t(end) - t(start);
  const months: { key: string; label: string; left: number; width: number; yearStart: boolean }[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const a = Date.UTC(y, m - 1, 1);
      const b = Date.UTC(y, m, 1);
      months.push({ key: `${y}-${String(m).padStart(2, "0")}`, label: `T${m}`, left: ((a - t(start)) / span) * 100, width: ((b - a) / span) * 100, yearStart: m === 1 });
    }
  }
  return { start, end, months, pos: (iso: string) => ((t(iso) - t(start)) / span) * 100 };
}

/**
 * Vị trí thanh (theo % khung): cắt phần nằm ngoài khung, báo bị cắt đầu / cuối.
 * Thiếu ngày bắt đầu hoặc kết thúc → null; ngày kết thúc tính trọn ngày.
 */
export function barPosition(startAt: string, endAt: string, w: { start: string; end: string }) {
  if (!startAt || !endAt) return null;
  const s = t(startAt);
  const e = t(endAt) + DAY;
  const ws = t(w.start);
  const we = t(w.end);
  if (!(e > s) || e <= ws || s >= we) return null;
  const span = we - ws;
  const a = Math.max(s, ws);
  const b = Math.min(e, we);
  return { left: ((a - ws) / span) * 100, width: ((b - a) / span) * 100, clippedStart: s < ws, clippedEnd: e > we };
}

/** Tiến độ thời gian (% đã trôi qua) của nhiệm vụ tại `today`. */
export function elapsedPct(startAt: string, endAt: string, today: string) {
  if (!startAt || !endAt) return null;
  const s = t(startAt);
  const e = t(endAt) + DAY;
  if (!(e > s)) return null;
  return Math.round(Math.min(1, Math.max(0, (t(today) - s) / (e - s))) * 100);
}
