import { cultureBatchStore, mediaBatchStore, type CultureBatch } from "@/lib/modules/m3/data/tissue";
import { validateCultureBatch } from "@/lib/modules/m3/tissue-rules";

/** Kiểm tra mẻ cấy (sau khi trộn với bản ghi cũ khi sửa) với lô môi trường và chuỗi mẻ cha. */
export async function checkCultureBatch(b: Partial<CultureBatch>) {
  const [batches, mediaBatches] = await Promise.all([cultureBatchStore.list(), mediaBatchStore.list()]);
  const mediaBatch = b.mediaBatchId ? mediaBatches.find((m) => m.id === b.mediaBatchId) ?? null : null;
  return validateCultureBatch(
    {
      id: b.id,
      parentBatchId: b.parentBatchId ?? "",
      startedAt: b.startedAt ?? "",
      vessels: Number(b.vessels) || 0,
      contaminated: Number(b.contaminated) || 0,
      explants: Number(b.explants) || 0,
      survived: Number(b.survived) || 0,
    },
    { mediaBatch, batches },
  );
}
