// Định dạng gọn cho bảng điều khiển bán hàng M4 (hàm thuần).

const nf1 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

/** 1_234_000_000 → "1,2 tỷ"; 350_000_000 → "350 tr"; 45_000 → "45 nghìn". */
export function compactVND(v: number) {
  const n = Math.round(Number(v) || 0);
  const a = Math.abs(n);
  if (a >= 1e9) return `${nf1.format(n / 1e9)} tỷ`;
  if (a >= 1e6) return `${nf1.format(n / 1e6)} tr`;
  if (a >= 1e3) return `${nf1.format(n / 1e3)} nghìn`;
  return `${n.toLocaleString("vi-VN")} đ`;
}

// Tiền tố loại hình tổ chức – bỏ khi lấy chữ viết tắt.
const ORG_PREFIX = /^(công ty|cty|tnhh|cổ phần|cp|mtv|htx|hợp tác xã|trung tâm|tt|doanh nghiệp|dntn|chi cục|phòng|sở|ubnd|viện|trường|hộ|ông|bà|anh|chị)\s+/i;

/** Chữ viết tắt 2 ký tự làm avatar khách hàng. */
export function initials(name: string) {
  let s = (name || "").trim();
  for (let i = 0; i < 4; i++) s = s.replace(ORG_PREFIX, "");
  const words = s.split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const pick = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
  return pick.map((w) => w.charAt(0).toLocaleUpperCase("vi-VN")).join("").slice(0, 2);
}

/** Tỷ lệ % thay đổi so với kỳ trước; kỳ trước = 0 → null. */
export function deltaPct(cur: number, prev: number) {
  if (!(prev > 0)) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}
