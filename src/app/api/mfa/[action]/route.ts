import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import QRCode from "qrcode";
import { authorize } from "@/lib/data/access";
import { logChange } from "@/lib/data/change-log";
import {
  LOCK_MINUTES,
  MAX_FAILED,
  MFA_COOKIE,
  checkCode,
  confirmEnrollment,
  getMfa,
  logAuthEvent,
  makeMfaCookie,
  mfaRequirement,
  recentFailures,
  removeMfa,
  sessionUser,
  startEnrollment,
} from "@/lib/security/mfa";

export const dynamic = "force-dynamic";

/** Tài khoản của phiên hiện tại (đọc trực tiếp token Neon Auth để gắn cookie 2 lớp với phiên). */
async function current() {
  const jar = await cookies();
  const token = jar.getAll().find((c) => c.name.endsWith("session_token"))?.value ?? "";
  const user = token ? await sessionUser(token) : null;
  const h = await headers();
  return { jar, token, user, ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "", userAgent: h.get("user-agent") ?? "" };
}

async function trust(jar: Awaited<ReturnType<typeof cookies>>, userId: string, token: string, email: string) {
  const { trustHours } = await mfaRequirement(email);
  jar.set(MFA_COOKIE, makeMfaCookie("ok", userId, token, trustHours * 3600), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: trustHours * 3600,
  });
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(_req: Request, { params }: { params: Promise<{ action: string }> }) {
  if ((await params).action !== "status") return bad("Không hỗ trợ", 404);
  const { user } = await current();
  if (!user) return bad("Chưa đăng nhập", 401);
  const rec = await getMfa(user.email);
  const need = await mfaRequirement(user.email);
  return NextResponse.json({ email: user.email, enabled: Boolean(rec?.enabled), pending: Boolean(rec && !rec.enabled), required: need.required, recoveryLeft: rec?.recoveryLeft ?? 0 });
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const action = (await params).action;
  const { jar, token, user, ip, userAgent } = await current();
  if (action === "logout") {
    jar.delete(MFA_COOKIE);
    return NextResponse.json({ ok: true });
  }
  if (!user) return bad("Chưa đăng nhập", 401);
  const body = (await req.json().catch(() => ({}))) as { code?: string; email?: string };
  const code = String(body.code ?? "").trim();
  const ev = (event: string, detail = "", email = user.email) => logAuthEvent({ email, event, ip, userAgent, detail });

  if (action === "enroll") {
    try {
      const { secret, uri } = await startEnrollment(user.email, user.userId);
      const qr = await QRCode.toString(uri, { type: "svg", margin: 1, width: 200 });
      return NextResponse.json({ secret, uri, qr });
    } catch (e) {
      return bad((e as Error).message, 409);
    }
  }

  if (action === "confirm" || action === "verify" || action === "disable") {
    if ((await recentFailures(user.email)) >= MAX_FAILED) {
      await ev("Xác thực 2 lớp bị khóa tạm", `>= ${MAX_FAILED} lần sai`);
      return bad(`Nhập sai quá ${MAX_FAILED} lần – thử lại sau ${LOCK_MINUTES} phút`, 429);
    }
    if (action === "confirm") {
      const codes = await confirmEnrollment(user.email, code).catch((e: Error) => e);
      if (codes instanceof Error) return bad(codes.message, 409);
      if (!codes) {
        await ev("Xác thực 2 lớp sai", "xác nhận đăng ký");
        return bad("Mã không đúng – kiểm tra giờ trên điện thoại và thử lại");
      }
      await ev("Bật xác thực 2 lớp");
      await ev("Xác thực 2 lớp đạt", "xác nhận đăng ký");
      await logChange({ entity: "mfa", entityId: user.email, action: "Bật xác thực 2 lớp", label: user.email });
      await trust(jar, user.userId, token, user.email);
      return NextResponse.json({ ok: true, recoveryCodes: codes });
    }
    const check = await checkCode(user.email, code, { allowRecovery: true });
    if (!check.ok) {
      await ev("Xác thực 2 lớp sai", action === "disable" ? "gỡ 2 lớp" : "");
      const left = MAX_FAILED - (await recentFailures(user.email));
      return bad(`${check.reason}${left > 0 ? ` (còn ${left} lần thử)` : ""}`);
    }
    await ev("Xác thực 2 lớp đạt", check.method);
    if (action === "disable") {
      await removeMfa(user.email);
      await ev("Gỡ xác thực 2 lớp", "người dùng tự gỡ");
      await logChange({ entity: "mfa", entityId: user.email, action: "Gỡ xác thực 2 lớp", label: user.email });
      jar.delete(MFA_COOKIE);
      return NextResponse.json({ ok: true });
    }
    await trust(jar, user.userId, token, user.email);
    return NextResponse.json({ ok: true, method: check.method });
  }

  if (action === "reset") {
    const gate = await authorize("admin.users");
    if (!gate.ok) return gate.response;
    const email = String(body.email ?? "").trim();
    if (!email) return bad("Thiếu email");
    if (!(await getMfa(email))) return bad(`${email} chưa đăng ký xác thực 2 lớp`, 404);
    await removeMfa(email);
    await ev("Đặt lại xác thực 2 lớp", `bởi ${gate.actor.name}`, email);
    await logChange({ entity: "mfa", entityId: email, action: "Đặt lại xác thực 2 lớp", label: email, actor: gate.actor.name });
    return NextResponse.json({ ok: true });
  }
  return bad("Không hỗ trợ", 404);
}
