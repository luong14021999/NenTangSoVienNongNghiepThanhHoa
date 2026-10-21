import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { removeLine } from "@/lib/modules/m4/data/quotation-flow";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.services");
  if (!gate.ok) return gate.response;
  const r = await removeLine((await params).id);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true });
}
