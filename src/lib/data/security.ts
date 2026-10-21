// M1.7 An toàn thông tin: tài khoản, phiên đăng nhập, sự kiện xác thực.
import { dbQuery } from "@/lib/db";

export async function listAccounts() {
  const rows = await dbQuery(
    `select u.id, u.email, u.name, u."createdAt" created_at,
            (select max(s."createdAt") from neon_auth.session s where s."userId" = u.id) last_login,
            (select count(*)::int from neon_auth.session s where s."userId" = u.id and s."expiresAt" > now()) active_sessions,
            m.enabled mfa_enabled, m.enrolled_at, m.last_used_at mfa_last_used, coalesce(array_length(m.recovery_hashes, 1), 0) recovery_left,
            r.roles, r.active role_active, st.full_name staff_name
     from neon_auth."user" u
     left join public.user_mfa m on lower(m.email) = lower(u.email)
     left join public.user_roles r on lower(r.email) = lower(u.email)
     left join public.staff st on lower(st.email) = lower(u.email)
     order by u.email`,
  );
  return rows.map((r) => ({
    id: String(r.id),
    email: r.email as string,
    name: (r.staff_name as string) || (r.name as string) || "",
    createdAt: (r.created_at as string) ?? "",
    lastLogin: (r.last_login as string) ?? "",
    activeSessions: Number(r.active_sessions ?? 0),
    mfa: r.mfa_enabled === null || r.mfa_enabled === undefined ? "Chưa đăng ký" : r.mfa_enabled ? "Đã bật" : "Đang đăng ký",
    recoveryLeft: Number(r.recovery_left ?? 0),
    roles: ((r.roles as string[]) ?? []).join(", "),
    linkedStaff: Boolean(r.staff_name),
  }));
}

export async function listSessions(limit = 40) {
  const rows = await dbQuery(
    `select s.id, u.email, s."createdAt" created_at, s."expiresAt" expires_at, s."ipAddress" ip, s."userAgent" ua
     from neon_auth.session s join neon_auth."user" u on u.id = s."userId" order by s."createdAt" desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({
    id: String(r.id),
    email: r.email as string,
    createdAt: r.created_at as string,
    expiresAt: r.expires_at as string,
    active: Date.parse(r.expires_at as string) > Date.now(),
    ip: (r.ip as string) ?? "",
    device: deviceOf((r.ua as string) ?? ""),
  }));
}

/** Tóm tắt user-agent: trình duyệt · hệ điều hành. */
export function deviceOf(ua: string) {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl/i.test(ua) ? "curl" : "Khác";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

export async function listAuthEvents(limit = 60) {
  const rows = await dbQuery(`select * from public.auth_events order by at desc limit $1`, [limit]);
  return rows.map((r) => ({ id: String(r.id), at: r.at as string, email: (r.email as string) ?? "", event: r.event as string, ip: (r.ip as string) ?? "", device: deviceOf((r.user_agent as string) ?? ""), detail: (r.detail as string) ?? "" }));
}

export async function securityCounters() {
  const [r] = await dbQuery(
    `select (select count(*)::int from neon_auth."user") accounts,
            (select count(*)::int from public.user_mfa where enabled) mfa_on,
            (select count(*)::int from public.auth_events where event = 'Xác thực 2 lớp sai' and at > now() - interval '24 hours') mfa_failed_24h,
            (select count(*)::int from neon_auth.session where "expiresAt" > now()) active_sessions,
            (select count(*)::int from public.api_calls where status >= 400 and at > now() - interval '24 hours') api_denied_24h,
            (select count(*)::int from public.change_log where at > now() - interval '24 hours') changes_24h,
            (select count(*)::int from public.user_roles) role_rows`,
  );
  return {
    accounts: Number(r.accounts),
    mfaOn: Number(r.mfa_on),
    mfaFailed24h: Number(r.mfa_failed_24h),
    activeSessions: Number(r.active_sessions),
    apiDenied24h: Number(r.api_denied_24h),
    changes24h: Number(r.changes_24h),
    rbacEnabled: Number(r.role_rows) > 0,
  };
}
