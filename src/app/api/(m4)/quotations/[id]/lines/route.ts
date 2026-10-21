import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { addLine } from "@/lib/modules/m4/data/quotation-flow";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.services");
  if (!gate.ok) return gate.response;
  const b = (await req.json().catch(() => ({}))) as Parameters<typeof addLine>[1];
  const r = await addLine((await params).id, b);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, item: r.value }, { status: 201 });
}
