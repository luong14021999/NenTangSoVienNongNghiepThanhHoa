// Thống kê sản lượng, thời gian trả kết quả, doanh thu (M2.7) – hàm thuần, kiểm thử được.

/** "2026-05-18T14:30:00Z" → "2026-05" theo giờ Việt Nam. */
export function monthKey(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date(iso)).slice(0, 7);
}

/** n tháng gần nhất tính đến tháng của `today` (cũ → mới). */
export function lastMonths(today: string, n: number) {
  const [y, m] = today.slice(0, 7).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Số ngày (lịch) từ ngày nhận mẫu đến ngày phát hành phiếu, theo giờ Việt Nam. */
export function turnaroundDays(receivedAt: string, issuedAt: string) {
  const d = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
  return Math.round((Date.parse(d(issuedAt)) - Date.parse(d(receivedAt))) / 86_400_000);
}

export function median(xs: number[]) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Giá trị phiếu yêu cầu: Σ đơn giá chỉ tiêu × số mẫu, cộng VAT %. */
export function requestValue(criteria: { unitPrice?: number }[], samples: number, vatRate: number) {
  const net = criteria.reduce((s, c) => s + (Number(c.unitPrice) || 0), 0) * Math.max(0, samples || 0);
  return { net, vat: Math.round((net * (vatRate || 0)) / 100), total: net + Math.round((net * (vatRate || 0)) / 100) };
}

/** Đếm theo tháng cho danh sách mốc thời gian. */
export function countByMonth(dates: string[], months: string[]) {
  const c = Object.fromEntries(months.map((m) => [m, 0]));
  for (const d of dates) {
    const k = monthKey(d);
    if (k in c) c[k]++;
  }
  return months.map((m) => c[m]);
}
