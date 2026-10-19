import { createNeonAuth } from "@neondatabase/auth/next/server";

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
