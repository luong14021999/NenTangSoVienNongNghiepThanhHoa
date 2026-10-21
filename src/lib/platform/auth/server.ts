import { createNeonAuth } from "@neondatabase/auth/next/server";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL;
const NEON_AUTH_COOKIE_SECRET = process.env.NEON_AUTH_COOKIE_SECRET;

/** Chưa cấu hình Neon Auth → không bật auth, mọi route đều mở. */
export function isAuthConfigured() {
  return Boolean(NEON_AUTH_BASE_URL && NEON_AUTH_COOKIE_SECRET);
}

export const auth = isAuthConfigured()
  ? createNeonAuth({
      baseUrl: NEON_AUTH_BASE_URL!,
      cookies: { secret: NEON_AUTH_COOKIE_SECRET! },
    })
  : null;

/**
 * auth.getSession() an toàn cho server component. SDK Neon Auth (0.6 beta) tự ghi lại cookie khi phiên
 * cần làm mới / đã hết hạn, nhưng Next.js chỉ cho ghi cookie trong Server Action / Route Handler.
 * Các trang nội bộ không gặp vì proxy làm mới phiên trước; /login, /mfa thì có thể gặp khi còn cookie cũ
 * → coi như chưa đăng nhập (người dùng đăng nhập lại, cookie được thay bằng phiên mới).
 */
export async function getSessionSafe() {
  if (!auth) return { data: null };
  try {
    return await auth.getSession();
  } catch (e) {
    if (/Cookies can only be modified/i.test((e as Error).message)) return { data: null };
    throw e;
  }
}

/**
 * Người dùng đang đăng nhập (server: route handler / server component) – ghi vào lưu vết.
 * Tài khoản được gắn với hồ sơ nhân sự qua email: nếu trùng email, tên người thao tác = họ tên
 * trong Nhân sự, để đối chiếu đúng với ủy quyền phép thử (§6.2) và cam kết (§4.1, §4.2).
 */
export async function currentActor(): Promise<{ name: string; email: string; staffCode?: string } | null> {
  if (!auth) return { name: "Người dùng (chưa bật đăng nhập)", email: "" };
  const { data } = await getSessionSafe();
  const user = data?.user;
  if (!user) return null;
  if (isDbConfigured() && user.email) {
    const [staff] = await dbQuery(
      `select code, full_name from public.staff where lower(email) = lower($1) limit 1`,
      [user.email],
    );
    if (staff?.full_name) return { name: staff.full_name as string, email: user.email, staffCode: staff.code as string };
  }
  return { name: user.name || user.email, email: user.email };
}
