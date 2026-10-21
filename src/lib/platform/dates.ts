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

/** ISO → "dd/MM/yyyy HH:mm" theo giờ Việt Nam. */
export function fmtDateTimeVN(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
}
