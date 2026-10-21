// Khóa API cho hệ thống bên ngoài (M1.3): chỉ lưu mã băm, cấp theo phạm vi (scope).
import { randomBytes } from "crypto";
import { sha256Hex } from "@/lib/security/crypto";

export const API_SCOPES = {
  "catalogs:read": "Đọc danh mục dùng chung (MDM)",
  "tests:read": "Đọc danh mục 59 phép thử VILAS 1501",
  "reports:verify": "Xác minh phiếu kết quả theo mã",
  "samples:status": "Tra cứu trạng thái mẫu theo mã",
  "stats:read": "Đọc số liệu thống kê tổng hợp",
  "warehouse:read": "Đọc tập dữ liệu kho dữ liệu dùng chung",
  "lgsp:inbound": "Gửi thông điệp vào hệ thống qua LGSP/NDXP",
} as const;
export type ApiScope = keyof typeof API_SCOPES;

const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** "vnn_" + 32 ký tự base62. Chỉ hiện một lần lúc tạo. */
export function generateApiKey() {
  const bytes = randomBytes(32);
  return `vnn_${Array.from(bytes, (b) => B62[b % 62]).join("")}`;
}

export const hashApiKey = (key: string) => sha256Hex(key.trim());
export const keyPrefix = (key: string) => key.slice(0, 10);

export const isApiKeyFormat = (key: string) => /^vnn_[0-9A-Za-z]{32}$/.test(key.trim());

export function hasScope(scopes: readonly string[], need: ApiScope) {
  return scopes.includes(need) || scopes.includes("*");
}

/** Giới hạn tần suất cửa sổ trượt 1 phút: true nếu còn được gọi. */
export const withinRateLimit = (callsLastMinute: number, limitPerMinute: number) =>
  limitPerMinute <= 0 || callsLastMinute < limitPerMinute;
