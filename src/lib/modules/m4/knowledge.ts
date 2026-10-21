// M4.5 Kho tri thức & dữ liệu nền, M4.6 Tài sản trí tuệ, hợp tác, chuyển giao – quy tắc thuần, kiểm thử được.

export const KNOWLEDGE_KINDS = [
  "Kết quả đề tài",
  "Số liệu thí nghiệm",
  "Quy trình kỹ thuật",
  "Báo cáo tổng kết",
  "Tiêu chuẩn – quy chuẩn",
  "Phương pháp nghiên cứu",
  "Bài báo khoa học",
  "Sách – tài liệu",
  "Khác",
] as const;
export const AUTHOR_ROLES = ["Tác giả chính", "Tác giả", "Đồng tác giả"] as const;
export const BASE_THEMES = ["Đất đai", "Khí hậu", "Thủy văn", "Cơ cấu cây trồng", "Cơ cấu vật nuôi", "Hạ tầng nghiên cứu"] as const;
export const UPDATE_FREQUENCIES = ["Hằng tháng", "Hằng quý", "Hằng năm", "Một lần"] as const;

export const IP_KINDS = ["Sáng chế", "Giải pháp hữu ích", "Kiểu dáng công nghiệp", "Nhãn hiệu", "Chỉ dẫn địa lý", "Bằng bảo hộ giống cây trồng", "Quyền tác giả"] as const;
export const IP_STATUSES = ["Đang soạn hồ sơ", "Đã nộp đơn", "Đang thẩm định", "Được cấp bằng", "Bị từ chối", "Hết hiệu lực"] as const;
export const PARTNER_KINDS = ["Doanh nghiệp", "Viện – Trường", "Cơ quan nhà nước", "Hợp tác xã", "Tổ chức quốc tế", "Khác"] as const;
export const AGREEMENT_KINDS = ["Biên bản ghi nhớ (MOU)", "Thỏa thuận hợp tác", "Chương trình hợp tác", "Hợp đồng nghiên cứu"] as const;
export const AGREEMENT_STATUSES = ["Đang đàm phán", "Đang hiệu lực", "Hết hạn", "Chấm dứt"] as const;
export const TRANSFER_FORMS = ["Chuyển nhượng quyền sở hữu", "Chuyển giao quyền sử dụng", "Chuyển giao kèm đào tạo, hỗ trợ kỹ thuật"] as const;
export const TRANSFER_STATUSES = ["Đang đàm phán", "Đã ký", "Đã bàn giao", "Đã thanh lý", "Hủy"] as const;
export const TRAINING_MODES = ["Trực tuyến", "Trực tiếp", "Kết hợp"] as const;
export const TRAINING_STATUSES = ["Kế hoạch", "Đang mở đăng ký", "Đã tổ chức", "Hủy"] as const;

/** Số ngày từ `today` đến `date` ("YYYY-MM-DD"); thiếu → NaN. */
const daysTo = (date: string, today: string) => (date ? Math.round((Date.parse(date.slice(0, 10)) - Date.parse(today)) / 86_400_000) : NaN);

/** Văn bằng đã cấp sắp / đã hết hiệu lực (cần gia hạn, nộp phí duy trì). */
export function ipExpiryAlert(a: { status: string; expiresAt: string }, today: string, warnDays = 180) {
  if (a.status !== "Được cấp bằng") return null;
  const d = daysTo(a.expiresAt, today);
  if (!Number.isFinite(d)) return null;
  if (d < 0) return { kind: "Văn bằng đã hết hiệu lực" as const, days: -d };
  if (d <= warnDays) return { kind: "Văn bằng sắp hết hiệu lực" as const, days: d };
  return null;
}

/** Thỏa thuận đang hiệu lực sắp / đã quá hạn. */
export function agreementExpiryAlert(a: { status: string; validUntil: string }, today: string, warnDays = 60) {
  if (a.status !== "Đang hiệu lực") return null;
  const d = daysTo(a.validUntil, today);
  if (!Number.isFinite(d)) return null;
  if (d < 0) return { kind: "Thỏa thuận đã quá hạn" as const, days: -d };
  if (d <= warnDays) return { kind: "Thỏa thuận sắp hết hạn" as const, days: d };
  return null;
}

// ── Nhập số liệu dữ liệu nền từ CSV ─────────────────────────────────

export type ObservationRow = { location: string; period: string; indicator: string; value: number | null; unit: string };

const HEADER = /^(dia ban|location)/i;

/** Tách 1 dòng CSV theo dấu phân cách, hỗ trợ ô trong ngoặc kép. */
function splitLine(line: string, sep: string) {
  const out: string[] = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/**
 * Đọc số theo quy ước của tệp: `decimalComma` (Excel tiếng Việt, tệp ; hoặc tab) → "1.234,5" (vẫn nhận "35.2");
 * ngược lại (tệp phân cách bằng phẩy) → "1234.5" hoặc "1,234.5". Trống → null; không đọc được → NaN.
 */
export function parseNumberVi(s: string, decimalComma: boolean): number | null {
  const t = s.replace(/\s/g, "");
  if (!t) return null;
  let norm: string;
  if (!decimalComma) norm = t.replace(/,/g, "");
  else if (t.includes(",")) norm = t.replace(/\./g, "").replace(",", ".");
  // Chỉ có dấu chấm: "1.234.567" là dấu nghìn; "35.2" (Excel bản tiếng Anh) là thập phân.
  else norm = /^-?\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
  const n = Number(norm);
  return /^-?\d+(\.\d+)?$/.test(norm) && Number.isFinite(n) ? n : NaN;
}

/**
 * Đọc CSV số liệu: cột Địa bàn, Kỳ (YYYY hoặc YYYY-MM), Chỉ tiêu, Giá trị, Đơn vị.
 * Dấu phân cách: tab, chấm phẩy hoặc phẩy (tự nhận theo dòng đầu); tệp ; hoặc tab dùng dấu phẩy thập phân.
 * Dòng tiêu đề (nếu có) được bỏ qua.
 */
export function parseObservationsCsv(text: string, maxRows = 5000) {
  const lines = String(text ?? "").replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trimEnd());
  const first = lines.find((l) => l.trim()) ?? "";
  const sep = first.includes("\t") ? "\t" : first.includes(";") ? ";" : ",";
  const rows: ObservationRow[] = [];
  const errors: { line: number; message: string }[] = [];
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const cells = splitLine(raw, sep);
    const lineNo = i + 1;
    if (rows.length === 0 && errors.length === 0 && HEADER.test(cells[0].normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d"))) return;
    const [location = "", period = "", indicator = "", valueText = "", unit = ""] = cells;
    if (!/^\d{4}(-(0[1-9]|1[0-2]))?$/.test(period)) return void errors.push({ line: lineNo, message: `Kỳ "${period}" phải dạng YYYY hoặc YYYY-MM` });
    if (!indicator) return void errors.push({ line: lineNo, message: "Thiếu chỉ tiêu" });
    const value = parseNumberVi(valueText, sep !== ",");
    if (Number.isNaN(value)) return void errors.push({ line: lineNo, message: `Giá trị "${valueText}" không phải số` });
    if (rows.length >= maxRows) return void errors.push({ line: lineNo, message: `Quá ${maxRows} dòng – chia nhỏ tệp` });
    rows.push({ location: location.slice(0, 200), period, indicator: indicator.slice(0, 200), value, unit: unit.slice(0, 50) });
  });
  return { rows, errors };
}
