// Xác thực 2 lớp (M1.1): đăng ký, kiểm tra mã TOTP / mã khôi phục, chặn dò mã, cookie "trình duyệt đã xác thực".
// Cookie gắn với tài khoản (userId) + mã băm phiên; đăng nhập lại để ký điện tử trên cùng trình duyệt không phải nhập lại mã.
import { dbQuery } from "@/lib/db";
import { newRecoveryCodes, newTotpSecret, otpauthUri, verifyTotp } from "@/lib/security/totp";
import { decryptText, encryptText, sha256Hex, signValue, verifySignedValue } from "@/lib/security/crypto";

export const MFA_COOKIE = "vnn_mfa";
export const MFA_ISSUER = "VNN Thanh Hoa LIMS";
export const MAX_FAILED = 5;
export const LOCK_MINUTES = 10;

export const mfaSecret = () => process.env.MFA_SECRET || process.env.NEON_AUTH_COOKIE_SECRET || "dev-only-mfa-secret";

export type MfaRecord = {
  email: string;
  userId: string;
  enabled: boolean;
  enrolledAt: string;
  lastUsedAt: string;
  recoveryLeft: number;
};

const nowUnix = () => Math.floor(Date.now() / 1000);

export async function getMfa(email: string): Promise<(MfaRecord & { secretEnc: string; lastCounter: number; recoveryHashes: string[] }) | null> {
  const [r] = await dbQuery(
    `select email, user_id, secret_enc, enabled, last_counter, recovery_hashes, enrolled_at, last_used_at from public.user_mfa where lower(email) = lower($1)`,
    [email],
  );
  if (!r) return null;
  const hashes = (r.recovery_hashes as string[]) ?? [];
  return {
    email: r.email as string,
    userId: (r.user_id as string) ?? "",
    enabled: Boolean(r.enabled),
    enrolledAt: (r.enrolled_at as string) ?? "",
    lastUsedAt: (r.last_used_at as string) ?? "",
    recoveryLeft: hashes.length,
    secretEnc: r.secret_enc as string,
    lastCounter: Number(r.last_counter ?? -1),
    recoveryHashes: hashes,
  };
}

export async function listMfa(): Promise<MfaRecord[]> {
  const rows = await dbQuery(`select email, user_id, enabled, recovery_hashes, enrolled_at, last_used_at from public.user_mfa order by email`);
  return rows.map((r) => ({
    email: r.email as string,
    userId: (r.user_id as string) ?? "",
    enabled: Boolean(r.enabled),
    enrolledAt: (r.enrolled_at as string) ?? "",
    lastUsedAt: (r.last_used_at as string) ?? "",
    recoveryLeft: ((r.recovery_hashes as string[]) ?? []).length,
  }));
}

export async function logAuthEvent(e: { email: string; event: string; ip?: string; userAgent?: string; detail?: string }) {
  await dbQuery(`insert into public.auth_events (email, event, ip, user_agent, detail) values ($1, $2, $3, $4, $5)`, [
    e.email,
    e.event,
    e.ip ?? "",
    e.userAgent ?? "",
    e.detail ?? "",
  ]);
}

/** Số lần nhập sai trong LOCK_MINUTES phút, tính từ lần nhập đúng gần nhất. */
export async function recentFailures(email: string) {
  const [r] = await dbQuery(
    `select count(*)::int n from public.auth_events
     where lower(email) = lower($1) and event = 'Xác thực 2 lớp sai' and at > now() - ($2 || ' minutes')::interval
       and at > coalesce((select max(at) from public.auth_events where lower(email) = lower($1) and event = 'Xác thực 2 lớp đạt'), 'epoch')`,
    [email, String(LOCK_MINUTES)],
  );
  return Number(r?.n ?? 0);
}

/** Bắt đầu đăng ký (hoặc đăng ký lại khi chưa kích hoạt): tạo khóa mới, chưa bật. */
export async function startEnrollment(email: string, userId: string) {
  const existing = await getMfa(email);
  if (existing?.enabled) throw new Error("Tài khoản đã bật xác thực 2 lớp – gỡ trước khi đăng ký lại");
  const secret = newTotpSecret();
  await dbQuery(
    `insert into public.user_mfa (email, user_id, secret_enc, enabled, last_counter, recovery_hashes)
     values ($1, $2, $3, false, -1, '{}')
     on conflict (email) do update set user_id = excluded.user_id, secret_enc = excluded.secret_enc, enabled = false, last_counter = -1, recovery_hashes = '{}'`,
    [email.toLowerCase(), userId, encryptText(secret, mfaSecret())],
  );
  return { secret, uri: otpauthUri(secret, email, MFA_ISSUER) };
}

/** Kiểm tra mã TOTP hoặc mã khôi phục; cập nhật bộ đếm chống dùng lại. */
export async function checkCode(email: string, code: string, opts: { allowRecovery: boolean }) {
  const rec = await getMfa(email);
  if (!rec) return { ok: false as const, reason: "Chưa đăng ký xác thực 2 lớp" };
  const secret = decryptText(rec.secretEnc, mfaSecret());
  const ctr = verifyTotp(secret, code, nowUnix(), rec.lastCounter);
  if (ctr !== null) {
    await dbQuery(`update public.user_mfa set last_counter = $2, last_used_at = now() where lower(email) = lower($1)`, [email, ctr]);
    return { ok: true as const, method: "Mã ứng dụng xác thực" };
  }
  const norm = code.trim().toLowerCase();
  if (opts.allowRecovery && /^[0-9a-f]{4}-[0-9a-f]{4}$/.test(norm)) {
    const h = sha256Hex(norm);
    if (rec.recoveryHashes.includes(h)) {
      await dbQuery(
        `update public.user_mfa set recovery_hashes = array_remove(recovery_hashes, $2), last_used_at = now() where lower(email) = lower($1)`,
        [email, h],
      );
      return { ok: true as const, method: `Mã khôi phục (còn ${rec.recoveryHashes.length - 1})` };
    }
  }
  return { ok: false as const, reason: "Mã không đúng hoặc đã hết hạn" };
}

/** Xác nhận đăng ký bằng mã đầu tiên → bật, sinh mã khôi phục (chỉ hiện một lần). */
export async function confirmEnrollment(email: string, code: string) {
  const rec = await getMfa(email);
  if (!rec) throw new Error("Chưa bắt đầu đăng ký");
  if (rec.enabled) throw new Error("Đã bật xác thực 2 lớp");
  const check = await checkCode(email, code, { allowRecovery: false });
  if (!check.ok) return null;
  const codes = newRecoveryCodes();
  await dbQuery(
    `update public.user_mfa set enabled = true, enrolled_at = now(), recovery_hashes = $2 where lower(email) = lower($1)`,
    [email, codes.map((c) => sha256Hex(c))],
  );
  return codes;
}

export async function removeMfa(email: string) {
  await dbQuery(`delete from public.user_mfa where lower(email) = lower($1)`, [email]);
}

// ── Cookie "trình duyệt đã xác thực 2 lớp" ─────────────────────────
// payload: "<trạng thái>~<userId>~<băm phiên 16 ký tự>"; trạng thái ok = đã nhập mã, none = không yêu cầu (kiểm lại sau 10 phút).
export const sessionTag = (sessionToken: string) => sha256Hex(sessionToken).slice(0, 16);

export function makeMfaCookie(state: "ok" | "none", userId: string, sessionToken: string, ttlSeconds: number) {
  return signValue(`${state}~${userId}~${sessionTag(sessionToken)}`, nowUnix() + ttlSeconds, mfaSecret());
}

export function readMfaCookie(value: string | undefined) {
  const p = verifySignedValue(value, nowUnix(), mfaSecret());
  if (!p) return null;
  const [state, userId, tag] = p.split("~");
  if ((state !== "ok" && state !== "none") || !userId) return null;
  return { state, userId, tag } as { state: "ok" | "none"; userId: string; tag: string };
}

/** Phiên Neon Auth từ token cookie (phần trước dấu chấm) → tài khoản. */
export async function sessionUser(sessionToken: string) {
  const token = sessionToken.split(".")[0];
  if (!token) return null;
  const [r] = await dbQuery(
    `select u.id, u.email from neon_auth.session s join neon_auth."user" u on u.id = s."userId"
     where s.token = $1 and s."expiresAt" > now()`,
    [token],
  );
  return r ? { userId: String(r.id), email: r.email as string } : null;
}

/** Tài khoản có phải nhập mã không: đã bật 2 lớp, hoặc chính sách bắt buộc. */
export async function mfaRequirement(email: string) {
  const [r] = await dbQuery(
    `select (select enabled from public.user_mfa where lower(email) = lower($1)) enabled,
            (select value from public.system_settings where key = 'mfa_required') required,
            (select value from public.system_settings where key = 'mfa_trust_hours') trust`,
    [email],
  );
  const enabled = Boolean(r?.enabled);
  const required = r?.required === true;
  return { enabled, required, mustVerify: enabled, mustEnroll: required && !enabled, trustHours: Number(r?.trust ?? 12) || 12 };
}
