import { NextResponse } from "next/server";
import { getRawFile } from "@/lib/modules/m2/data/results";

export const dynamic = "force-dynamic";

/** Tải file dữ liệu thô nguyên văn (cần đăng nhập – proxy chặn /api khi chưa đăng nhập). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getRawFile(id);
  if (!f) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return new NextResponse(f.content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      "X-Content-SHA256": f.sha256,
    },
  });
}
