import { NextResponse } from "next/server";
import { currentActor } from "@/lib/auth/server";
import { approveDraft } from "@/lib/data/release-rules";
import { logChange } from "@/lib/data/change-log";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const res = await approveDraft(id, actor.name);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
  await logChange({ entity: "release-rules", entityId: id, action: `Phê duyệt → phiên bản ${res.set.version} hiệu lực`, label: `Quy tắc kiểm soát v${res.set.version}`, actor: actor.name });
  return NextResponse.json({ ok: true, item: res.set });
}
