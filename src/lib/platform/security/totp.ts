// Mật khẩu một lần theo thời gian (TOTP – RFC 6238 / HOTP – RFC 4226) cho xác thực 2 lớp (M1.1).
// Tương thích Google Authenticator, Microsoft Authenticator, FreeOTP…: SHA-1, 6 chữ số, chu kỳ 30 giây.
import { createHmac, randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string) {
  const clean = text.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) throw new Error(`Ký tự base32 không hợp lệ: ${ch}`);
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Khóa bí mật mới 160 bit (base32). */
export const newTotpSecret = () => base32Encode(randomBytes(20));

export function hotp(secret: Buffer, counter: number, digits = 6) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", secret).update(msg).digest();
  const off = h[h.length - 1] & 0xf;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

export const totpCounter = (unixSeconds: number, step = 30) => Math.floor(unixSeconds / step);

export function totp(secretB32: string, unixSeconds: number, digits = 6) {
  return hotp(base32Decode(secretB32), totpCounter(unixSeconds), digits);
}

/**
 * Kiểm tra mã: chấp nhận lệch ±`window` chu kỳ (đồng hồ điện thoại lệch). Trả về bộ đếm khớp
 * (để chặn dùng lại cùng một mã) hoặc null. `lastCounter`: bộ đếm của lần dùng gần nhất.
 */
export function verifyTotp(secretB32: string, code: string, unixSeconds: number, lastCounter = -1, window = 1) {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  const key = base32Decode(secretB32);
  const now = totpCounter(unixSeconds);
  for (let d = -window; d <= window; d++) {
    const ctr = now + d;
    if (ctr > lastCounter && hotp(key, ctr) === c) return ctr;
  }
  return null;
}

/** URI cho ứng dụng xác thực (quét QR). */
export function otpauthUri(secretB32: string, account: string, issuer: string) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** 8 mã khôi phục dạng xxxx-xxxx (dùng một lần khi mất điện thoại). */
export function newRecoveryCodes(n = 8) {
  return Array.from({ length: n }, () => {
    const s = randomBytes(5).toString("hex").slice(0, 8);
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}
