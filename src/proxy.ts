import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

// Neon Auth: chưa đăng nhập → redirect /login (trang /login luôn được mở).
const requireAuth = auth?.middleware({ loginUrl: "/login" });

export async function proxy(request: NextRequest) {
  // Nếu chưa cấu hình Neon Auth → không bật auth, mọi route đều mở.
  if (!requireAuth) return NextResponse.next();
  const response = await requireAuth(request);

  // API dữ liệu (ISO/IEC 17025 §7.11): chưa đăng nhập → 401 JSON thay vì
  // redirect sang trang /login. /api/auth được Neon Auth tự bỏ qua.
  const isRedirect = response.status >= 300 && response.status < 400;
  if (isRedirect && request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match tất cả routes (kể cả /api – bắt buộc đăng nhập) trừ:
     * - /_next/static (Next.js internals)
     * - /_next/image (image optimization)
     * - assets: favicon, logo, icon, manifest, svg, png
     */
    "/((?!_next/static|_next/image|favicon.ico|logo-vnnth.png|icon-leaf.svg|manifest.json|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)",
  ],
};
