import { NextResponse } from "next/server";
import { validatePublicRequest } from "@/lib/modules/m4/portal";
import { createPublicRequest, withinPublicLimit } from "@/lib/modules/m4/data/portal";
import { ipHash } from "@/lib/platform/security/client-ip";
import { isDbConfigured } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

/** Cổng công khai (M4.1): khách gửi yêu cầu dịch vụ, không cần đăng nhập. Bảo vệ theo M4.7. */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    // Không trả chi tiết lỗi ra cổng công khai (M4.7).
    console.error("[public]", (e as Error).message);
    return NextResponse.json({ error: "Cổng tạm ngừng tiếp nhận, vui lòng thử lại sau hoặc gọi điện cho Viện" }, { status: 503 });
  }
}

async function handle(req: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "Cổng tạm ngừng tiếp nhận" }, { status: 503 });
  if (Number(req.headers.get("content-length") ?? 0) > 20_000) {
    return NextResponse.json({ error: "Nội dung quá lớn" }, { status: 413 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  // Ô ẩn (honeypot): người thật không thấy nên để trống; bot điền → trả về như thành công, không lưu.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true }, { status: 201 });

  const hash = ipHash(req);
  if (!(await withinPublicLimit("request", hash))) {
    return NextResponse.json({ error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau hoặc gọi điện cho Viện." }, { status: 429 });
  }
  const v = validatePublicRequest(body);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  const created = await createPublicRequest(v.value, hash);
  return NextResponse.json({ ok: true, ...created }, { status: 201 });
}
