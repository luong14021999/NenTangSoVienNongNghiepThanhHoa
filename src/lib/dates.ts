// Ngày "hôm nay" theo giờ Việt Nam (server Vercel chạy UTC).
const VN_TZ = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" của hôm nay theo giờ Việt Nam. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: VN_TZ }).format(new Date());
}

/** Số ngày từ hôm nay (giờ VN) đến `dateStr` ("YYYY-MM-DD"); NaN nếu trống. */
export function daysUntil(dateStr?: string | null) {
  if (!dateStr) return NaN;
  const ms = Date.parse(dateStr.slice(0, 10)) - Date.parse(todayISO());
  return Math.round(ms / 86_400_000);
}

/** "YYYY-MM-DD" → "DD/MM/YYYY"; giữ nguyên nếu trống. */
export function fmtDateVN(iso?: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}
