import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { retryMessage } from "@/lib/platform/integration/lgsp";

export const dynamic = "force-dynamic";

/** Gửi lại thông điệp lỗi. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  const id = (await params).id;
  try {
    const r = await retryMessage(id, gate.actor.name);
    if (!r) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    await logChange({ entity: "integration", entityId: id, action: `Gửi lại – ${r.status}`, label: id, actor: gate.actor.name });
    return NextResponse.json(r, { status: r.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
