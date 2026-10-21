import { NextResponse } from "next/server";
import { ptRoundStore, verdictOfZ } from "@/lib/modules/m2/data/quality";
import { deleteRoute } from "@/lib/platform/api/crud";
import type { ExternalQCRound } from "@/lib/mock-data";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { authorize } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const patch = (await req.json()) as Partial<ExternalQCRound>;
  if (patch.z !== undefined) patch.verdict = verdictOfZ(Number(patch.z));
  const before = (await ptRoundStore.list()).find((r) => r.id === id);
  const item = await ptRoundStore.update(id, patch);
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const changes = diffFields((before ?? {}) as Record<string, unknown>, item as unknown as Record<string, unknown>);
  if (changes.length) await logChange({ entity: "pt-rounds", entityId: id, action: "Sửa", label: `${item.criterion} – ${item.provider}`, changes });
  return NextResponse.json({ ok: true, item });
}

export const DELETE = deleteRoute(ptRoundStore);
