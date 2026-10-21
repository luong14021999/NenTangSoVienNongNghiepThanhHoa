// Cổng xác thực 2 lớp trong proxy (M1.1): sau khi Neon Auth xác nhận đã đăng nhập, kiểm tra cookie 2 lớp.
// Có cookie hợp lệ cùng phiên → cho qua không truy vấn DB; ngược lại tra tài khoản + chính sách một lần.
import { NextResponse, type NextRequest } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { MFA_COOKIE, makeMfaCookie, mfaRequirement, readMfaCookie, sessionTag, sessionUser } from "@/lib/security/mfa";

const EXEMPT = ["/mfa", "/api/mfa/", "/api/auth/", "/login"];
const RECHECK_SECONDS = 600;

export const sessionTokenOf = (req: NextRequest) =>
  req.cookies.getAll().find((c) => c.name.endsWith("session_token"))?.value ?? "";

const cookieOpts = (maxAge: number) => ({ httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge });

export async function mfaGate(req: NextRequest, response: NextResponse) {
  const path = req.nextUrl.pathname;
  if (!isDbConfigured() || EXEMPT.some((p) => path === p || path.startsWith(p))) return response;
  const token = sessionTokenOf(req);
  if (!token) return response; // Neon Auth đã xử lý trường hợp chưa đăng nhập

  const c = readMfaCookie(req.cookies.get(MFA_COOKIE)?.value);
  if (c && c.tag === sessionTag(token)) return response;

  const user = await sessionUser(token);
  if (!user) return response;
  // Cookie 2 lớp còn hạn của cùng tài khoản nhưng phiên mới (đăng nhập lại để ký) → chuyển sang phiên mới.
  if (c?.state === "ok" && c.userId === user.userId) {
    const req2 = await mfaRequirement(user.email);
    response.cookies.set(MFA_COOKIE, makeMfaCookie("ok", user.userId, token, req2.trustHours * 3600), cookieOpts(req2.trustHours * 3600));
    return response;
  }
  const need = await mfaRequirement(user.email);
  if (!need.mustVerify && !need.mustEnroll) {
    response.cookies.set(MFA_COOKIE, makeMfaCookie("none", user.userId, token, RECHECK_SECONDS), cookieOpts(RECHECK_SECONDS));
    return response;
  }
  if (path.startsWith("/api/")) {
    return NextResponse.json(
      { error: need.mustEnroll ? "Cần đăng ký xác thực 2 lớp" : "Cần nhập mã xác thực 2 lớp", code: "MFA_REQUIRED" },
      { status: 401 },
    );
  }
  const url = req.nextUrl.clone();
  url.pathname = "/mfa";
  url.search = `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}
