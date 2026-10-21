import { NextResponse } from "next/server";
import { cultureBatchStore, seedlingLotStore, type SeedlingLot } from "@/lib/modules/m3/data/tissue";
import { acclimatizePlan, type AcclimatizeInput } from "@/lib/modules/m3/bench";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { badRequest, createError, loadBatchAction } from "../../load";

export const dynamic = "force-dynamic";

/** Ra ngôi: lập lô cây giống vườn ươm từ mẻ và chuyển mẻ sang "Chuyển ra ngôi". */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const loaded = await loadBatchAction<AcclimatizeInput>(req, ctx);
  if ("response" in loaded) return loaded.response;
  const { batch, body } = loaded;
  const plan = acclimatizePlan(batch, body);
  if ("error" in plan) return badRequest(plan.error);
  let lot: SeedlingLot;
  try {
    lot = await seedlingLotStore.create({ ...plan.lot, id: "" });
  } catch (e) {
    return createError(e, "lô cây giống");
  }
  try {
    await cultureBatchStore.update(batch.id, plan.batchPatch);
  } catch (e) {
    await seedlingLotStore.remove(lot.id).catch(() => {});
    throw e;
  }
  await logChange({ entity: "seedling-lots", entityId: lot.id, action: "Thêm", label: `${lot.code} (ra ngôi từ ${batch.code})` });
  await logChange({ entity: "culture-batches", entityId: batch.id, action: "Sửa", label: batch.code, changes: diffFields(batch, plan.batchPatch) });
  return NextResponse.json({ ok: true, item: lot }, { status: 201 });
}
