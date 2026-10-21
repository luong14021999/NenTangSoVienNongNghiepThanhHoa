import { NextResponse } from "next/server";
import { authorize, requireFreshAuth } from "@/lib/data/access";
import { revokeReport } from "@/lib/data/reports";
import { logChange } from "@/lib/data/change-log";

export const dynamic = "force-dynamic";

/** Thu hồi phiếu kết quả: cần quyền Trưởng phòng, lý do, và ký điện tử (xác thực lại). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("reports.revoke");
  if (!gate.ok) return gate.response;
  const reauth = await requireFreshAuth();
  if (reauth) return reauth;
  const { id } = await params;
  const { reason = "" } = (await req.json()) as { reason?: string };
  if (!reason.trim()) return NextResponse.json({ error: "Cần ghi lý do thu hồi" }, { status: 400 });
  const res = await revokeReport(id, reason.trim(), { name: gate.actor.name, email: gate.actor.email, roles: gate.roles });
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
  await logChange({
    entity: "test-reports",
    entityId: id,
    action: "Thu hồi",
    label: res.report.code,
    actor: gate.actor.name,
    changes: [
      { field: "status", old: res.previousStatus, new: "Đã thu hồi" },
      { field: "lý do", old: "", new: reason.trim() },
    ],
  });
  return NextResponse.json({ ok: true, item: res.report });
}
