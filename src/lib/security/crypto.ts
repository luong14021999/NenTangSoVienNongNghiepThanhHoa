// Mã hóa khóa bí mật khi lưu (AES-256-GCM) và cookie có chữ ký HMAC (M1.1, M1.7). Hàm thuần theo khóa truyền vào.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const keyOf = (secret: string, purpose: string) => createHash("sha256").update(`${purpose}:${secret}`).digest();

export function encryptText(plain: string, secret: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyOf(secret, "enc"), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${body.toString("base64url")}`;
}

export function decryptText(token: string, secret: string) {
  const [v, iv, tag, body] = token.split(".");
  if (v !== "v1" || !iv || !tag || body === undefined) throw new Error("Dữ liệu mã hóa không hợp lệ");
  const d = createDecipheriv("aes-256-gcm", keyOf(secret, "enc"), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(body, "base64url")), d.final()]).toString("utf8");
}

const mac = (data: string, secret: string) => createHmac("sha256", keyOf(secret, "cookie")).update(data).digest("base64url");

/** "payload.hết-hạn(giây).chữ-ký" – payload không chứa dấu chấm. */
export function signValue(payload: string, expUnix: number, secret: string) {
  const data = `${payload}.${expUnix}`;
  return `${data}.${mac(data, secret)}`;
}

/** Trả về payload nếu chữ ký đúng và chưa hết hạn, ngược lại null. */
export function verifySignedValue(value: string | undefined, nowUnix: number, secret: string) {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 0) return null;
  const data = value.slice(0, i);
  const sig = Buffer.from(value.slice(i + 1));
  const expect = Buffer.from(mac(data, secret));
  if (sig.length !== expect.length || !timingSafeEqual(sig, expect)) return null;
  const j = data.lastIndexOf(".");
  const exp = Number(data.slice(j + 1));
  if (!Number.isFinite(exp) || exp < nowUnix) return null;
  return data.slice(0, j);
}

export const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");
