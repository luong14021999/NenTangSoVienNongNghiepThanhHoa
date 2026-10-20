import { NextResponse } from "next/server";
import { currentActor } from "@/lib/auth/server";
import { issueReport, listReports } from "@/lib/data/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listReports();
  return NextResponse.json({ count: items.length, items });
}

/** Phát hành phiếu kết quả cho 1 mẫu (hoặc phiếu sửa đổi nếu đã có phiếu). Không có xoá (§8.4). */
export async function POST(req: Request) {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { sampleCode = "", note = "" } = (await req.json()) as { sampleCode?: string; note?: string };
  if (!sampleCode) return NextResponse.json({ error: "Thiếu mã mẫu" }, { status: 400 });
  const res = await issueReport(sampleCode, actor.name, note.trim());
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, item: res.report }, { status: 201 });
}
