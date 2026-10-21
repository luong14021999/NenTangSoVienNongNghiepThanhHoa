// M4.1 Cổng tiếp nhận dịch vụ – quy tắc thuần (định tuyến, sinh mã, kiểm tra đầu vào), kiểm thử được.
// Dùng được cả ở trình duyệt (form cổng) lẫn server: không import module Node.

export const REQUEST_KINDS = [
  "Phân tích – thử nghiệm",
  "Nuôi cấy mô – cây giống",
  "Giống cây trồng, vật nuôi, thủy sản",
  "Tư vấn – chuyển giao",
  "Khác",
] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export const TARGET_UNITS = [
  "M2 – Phòng Phân tích và Thí nghiệm",
  "M3.1 – Nuôi cấy mô",
  "M3.2 – Giống",
  "Bộ phận tư vấn",
] as const;
export type TargetUnit = (typeof TARGET_UNITS)[number];

export const REQUEST_CHANNELS = ["Trực tuyến", "Trực tiếp", "Điện thoại", "Email"] as const;
export const REQUEST_STATUSES = ["Mới tiếp nhận", "Đang xử lý", "Đã báo giá", "Đang thực hiện", "Hoàn thành", "Từ chối"] as const;

/** Định tuyến yêu cầu đến đơn vị xử lý theo loại dịch vụ. */
export function routeRequest(kind: string): TargetUnit {
  switch (kind) {
    case "Phân tích – thử nghiệm":
      return "M2 – Phòng Phân tích và Thí nghiệm";
    case "Nuôi cấy mô – cây giống":
      return "M3.1 – Nuôi cấy mô";
    case "Giống cây trồng, vật nuôi, thủy sản":
      return "M3.2 – Giống";
    default:
      return "Bộ phận tư vấn";
  }
}

// Bỏ 0/O, 1/I/L để khách đọc – gõ lại không nhầm.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Số ngẫu nhiên an toàn mật mã trong [0, n) (Web Crypto). */
const secureRandom = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;

/** Mã yêu cầu ngẫu nhiên YC-<năm>-<6 ký tự> (~ 8,9 × 10⁸ khả năng/năm) – khó đoán để tra cứu. */
export function newRequestCode(year: number, rand: (n: number) => number = secureRandom) {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[rand(CODE_ALPHABET.length)];
  return `YC-${year}-${s}`;
}

/** Chỉ giữ chữ số; +84 / 84 đầu số → 0. */
export function normalizePhone(v: string) {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.startsWith("84") && d.length >= 11 ? `0${d.slice(2)}` : d;
}

export const isValidPhone = (v: string) => /^0\d{9,10}$/.test(normalizePhone(v));
export const isValidEmail = (v: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v);

export type PublicRequestInput = {
  kind: RequestKind;
  orgName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  sampleCount: number;
};

const LIMITS = { orgName: 200, contactName: 100, email: 200, address: 300, description: 3000 } as const;

/** Kiểm tra & làm sạch dữ liệu khách gửi qua cổng. Trả lỗi đầu tiên (tiếng Việt) hoặc dữ liệu đã chuẩn hóa. */
export function validatePublicRequest(b: Record<string, unknown>): { error: string } | { value: PublicRequestInput } {
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string).trim() : "");
  const kind = str("kind");
  if (!(REQUEST_KINDS as readonly string[]).includes(kind)) return { error: "Chọn loại dịch vụ" };
  const contactName = str("contactName");
  if (!contactName) return { error: "Nhập họ tên người liên hệ" };
  const phone = normalizePhone(str("phone"));
  if (!isValidPhone(phone)) return { error: "Số điện thoại không hợp lệ" };
  const email = str("email");
  if (email && !isValidEmail(email)) return { error: "Email không hợp lệ" };
  const description = str("description");
  if (description.length < 10) return { error: "Mô tả yêu cầu ít nhất 10 ký tự" };
  const value = { kind: kind as RequestKind, orgName: str("orgName"), contactName, phone, email, address: str("address"), description };
  for (const [k, max] of Object.entries(LIMITS)) {
    if ((value as Record<string, string>)[k].length > max) return { error: `Nội dung quá dài (tối đa ${max} ký tự)` };
  }
  const n = Number(b.sampleCount ?? 0);
  const sampleCount = Number.isFinite(n) ? Math.min(10_000, Math.max(0, Math.round(n))) : 0;
  return { value: { ...value, sampleCount } };
}

/** Giới hạn tần suất cổng công khai (M4.7). */
export const RATE_LIMITS = {
  request: { perIp: 5, windowMinutes: 60, perDayTotal: 300 },
  status: { perIp: 30, windowMinutes: 60 },
} as const;
