import { NextResponse } from "next/server";
import { cultureBatchStore, type CultureBatch } from "@/lib/modules/m3/data/tissue";
import { transferPlan, type TransferInput } from "@/lib/modules/m3/bench";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { checkCultureBatch } from "../../check";
import { badRequest, createError, loadBatchAction } from "../../load";

export const dynamic = "force-dynamic";

/** Cấy chuyển: tạo mẻ con (nối mẻ cha) và chuyển mẻ cha sang "Đã cấy chuyển". */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const loaded = await loadBatchAction<TransferInput>(req, ctx);
  if ("response" in loaded) return loaded.response;
  const { batch, body } = loaded;
  const plan = transferPlan(batch, body);
  if ("error" in plan) return badRequest(plan.error);
  const err = await checkCultureBatch(plan.child);
  if (err) return badRequest(err);
  let child: CultureBatch;
  try {
    child = await cultureBatchStore.create({ ...plan.child, id: "" });
  } catch (e) {
    return createError(e, "mẻ cấy");
  }
  try {
    await cultureBatchStore.update(batch.id, plan.parentPatch);
  } catch (e) {
    await cultureBatchStore.remove(child.id).catch(() => {});
    throw e;
  }
  await logChange({ entity: "culture-batches", entityId: child.id, action: "Thêm", label: `${child.code} (cấy chuyển từ ${batch.code})` });
  await logChange({ entity: "culture-batches", entityId: batch.id, action: "Sửa", label: batch.code, changes: diffFields(batch, plan.parentPatch) });
  return NextResponse.json({ ok: true, item: child }, { status: 201 });
}
