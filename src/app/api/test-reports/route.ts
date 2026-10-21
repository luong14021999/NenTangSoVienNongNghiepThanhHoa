import { NextResponse } from "next/server";
import { authorize, requireFreshAuth } from "@/lib/data/access";
import { issueReport, listReports } from "@/lib/data/reports";
import { logChange } from "@/lib/data/change-log";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listReports();
  return NextResponse.json({ count: items.length, items });
}

/** Phát hành phiếu kết quả cho 1 mẫu (hoặc phiếu sửa đổi nếu đã có phiếu). Không có xoá (§8.4). */
export async function POST(req: Request) {
  const gate = await authorize("reports.issue");
  if (!gate.ok) return gate.response;
  const actor = gate.actor;
  // Phát hành = ký điện tử → phải vừa xác thực lại bằng mật khẩu.
  const reauth = await requireFreshAuth();
  if (reauth) return reauth;
  const { sampleCode = "", note = "" } = (await req.json()) as { sampleCode?: string; note?: string };
  if (!sampleCode) return NextResponse.json({ error: "Thiếu mã mẫu" }, { status: 400 });
  const res = await issueReport(sampleCode, { name: actor.name, email: actor.email, roles: gate.roles }, note.trim());
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
