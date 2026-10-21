import { NextResponse } from "next/server";
import { authorize, currentAccess } from "@/lib/platform/data/access";
import { applyAction } from "@/lib/modules/m4/data/quotation-flow";

export const dynamic = "force-dynamic";

/** Bước quy trình báo giá: submit | approve | return | send | accept | decline | expire | reopen. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.services");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { action?: string; note?: string };
  const { can } = await currentAccess();
  const r = await applyAction(id, String(b.action ?? ""), String(b.note ?? ""), gate.actor, can("services.approve"));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, item: r.value });
}
