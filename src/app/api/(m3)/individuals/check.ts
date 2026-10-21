import { individualStore, type Individual } from "@/lib/modules/m3/data/breeding";
import { validateParents } from "@/lib/modules/m3/breeding-rules";

/** Bố là đực, mẹ là cái, không tự làm bố / mẹ, không tạo vòng phả hệ. */
export async function checkParents(b: Partial<Individual>) {
  const all = await individualStore.list();
  return validateParents({ id: b.id, sireId: b.sireId ?? "", damId: b.damId ?? "" }, all);
}
