import { NextResponse } from "next/server";
import { publicRequestStatus, withinPublicLimit } from "@/lib/modules/m4/data/portal";
import { ipHash } from "@/lib/platform/security/client-ip";
import { isDbConfigured } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

const NOT_FOUND = "Không tìm thấy yêu cầu khớp mã và số điện thoại";

/** Tra cứu tình trạng yêu cầu (M4.1): cần đúng mã + số điện thoại; sai thì báo chung, không lộ mã có tồn tại. */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    // Không trả chi tiết lỗi ra cổng công khai (M4.7).
    console.error("[public]", (e as Error).message);
    return NextResponse.json({ error: "Tạm ngừng tra cứu, vui lòng thử lại sau" }, { status: 503 });
  }
}

async function handle(req: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "Tạm ngừng tra cứu" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { code?: unknown; phone?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.slice(0, 32) : "";
  const phone = typeof body?.phone === "string" ? body.phone.slice(0, 20) : "";
  if (!code || !phone) return NextResponse.json({ error: "Nhập mã yêu cầu và số điện thoại" }, { status: 400 });
  if (!(await withinPublicLimit("status", ipHash(req)))) {
    return NextResponse.json({ error: "Tra cứu quá nhiều lần. Vui lòng thử lại sau." }, { status: 429 });
  }
  const item = await publicRequestStatus(code, phone);
  if (!item) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}
