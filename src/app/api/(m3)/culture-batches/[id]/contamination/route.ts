import { NextResponse } from "next/server";
import { cultureBatchStore } from "@/lib/modules/m3/data/tissue";
import { recordContamination } from "@/lib/modules/m3/bench";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { badRequest, loadBatchAction } from "../../load";

export const dynamic = "force-dynamic";

/** Ghi nhiễm khi kiểm tra bình: cộng dồn số bình nhiễm của mẻ đang nuôi. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const loaded = await loadBatchAction<{ added?: number }>(req, ctx);
  if ("response" in loaded) return loaded.response;
  const { batch, body } = loaded;
  if (batch.status !== "Đang nuôi") return badRequest(`Mẻ ${batch.code} không còn đang nuôi`);
  const r = recordContamination(batch, Number(body.added));
  if ("error" in r) return badRequest(r.error);
  const item = await cultureBatchStore.update(batch.id, { contaminated: r.contaminated });
  await logChange({ entity: "culture-batches", entityId: batch.id, action: "Sửa", label: batch.code, changes: diffFields({ contaminated: batch.contaminated }, { contaminated: r.contaminated }) });
  return NextResponse.json({ ok: true, item });
}
