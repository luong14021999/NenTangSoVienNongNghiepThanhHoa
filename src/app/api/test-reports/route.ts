import { NextResponse } from "next/server";
import { currentActor } from "@/lib/auth/server";
import { issueReport, listReports } from "@/lib/data/reports";
import { logChange } from "@/lib/data/change-log";

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
  await logChange({
    entity: "test-reports",
    entityId: res.report.id,
    action: res.report.revision ? `Phát hành sửa đổi lần ${res.report.revision}` : "Phát hành",
    label: res.report.code,
    actor: actor.name,
    changes: res.report.replacesCode ? [{ field: "thay thế", old: res.report.replacesCode, new: res.report.code }] : [],
  });
  return NextResponse.json({ ok: true, item: res.report }, { status: 201 });
}
