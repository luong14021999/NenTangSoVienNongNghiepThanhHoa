import { NextResponse } from "next/server";
import { ptRoundStore, verdictOfZ } from "@/lib/data/quality";
import { deleteRoute } from "@/lib/api/crud";
import type { ExternalQCRound } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = (await req.json()) as Partial<ExternalQCRound>;
  if (patch.z !== undefined) patch.verdict = verdictOfZ(Number(patch.z));
  const item = await ptRoundStore.update(id, patch);
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}

export const DELETE = deleteRoute(ptRoundStore);
