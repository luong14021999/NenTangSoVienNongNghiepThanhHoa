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
 * Người dùng đang đăng nhập (server: route handler / server component) – ghi vào lưu vết.
 * Tài khoản được gắn với hồ sơ nhân sự qua email: nếu trùng email, tên người thao tác = họ tên
 * trong Nhân sự, để đối chiếu đúng với ủy quyền phép thử (§6.2) và cam kết (§4.1, §4.2).
 */
export async function currentActor(): Promise<{ name: string; email: string; staffCode?: string } | null> {
  if (!auth) return { name: "Người dùng (chưa bật đăng nhập)", email: "" };
  const { data } = await auth.getSession();
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
