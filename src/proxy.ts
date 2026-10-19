import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

// Neon Auth: chưa đăng nhập → redirect /login (trang /login luôn được mở).
const requireAuth = auth?.middleware({ loginUrl: "/login" });

export async function proxy(request: NextRequest) {
  // Nếu chưa cấu hình Neon Auth → không bật auth, mọi route đều mở.
  if (!requireAuth) return NextResponse.next();
  return requireAuth(request);
}

export const config = {
  matcher: [
    /*
     * Match tất cả routes trừ:
     * - /api (routes tự bảo vệ nếu cần; /api/auth là proxy của Neon Auth)
     * - /_next/static (Next.js internals)
     * - /_next/image (image optimization)
     * - assets: favicon, logo, icon, manifest, svg, png
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo-vnnth.png|icon-leaf.svg|manifest.json|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)",
  ],
};
