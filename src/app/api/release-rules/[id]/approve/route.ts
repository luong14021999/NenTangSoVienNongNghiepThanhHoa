import { NextResponse } from "next/server";
import { authorize } from "@/lib/data/access";
import { approveDraft } from "@/lib/data/release-rules";
import { logChange } from "@/lib/data/change-log";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await authorize("rules.approve");
  if (!gate.ok) return gate.response;
  const actor = gate.actor;
  const res = await approveDraft(id, actor.name);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
  await logChange({ entity: "release-rules", entityId: id, action: `Phê duyệt → phiên bản ${res.set.version} hiệu lực`, label: `Quy tắc kiểm soát v${res.set.version}`, actor: actor.name });
  return NextResponse.json({ ok: true, item: res.set });
}
