import { seedLotStore, type ProductionLot } from "@/lib/modules/m3/data/breeding";
import { validateLevelChain } from "@/lib/modules/m3/breeding-rules";

/** Sản xuất theo cấp: lô nguồn cùng giống, đã đạt kiểm định, ở cấp cao hơn cấp sản xuất ra. */
export async function checkProductionLot(b: Partial<ProductionLot>) {
  if (!b.sourceSeedLotId) return null;
  const src = (await seedLotStore.list()).find((s) => s.id === b.sourceSeedLotId);
  if (!src) return "Không tìm thấy lô giống nguồn";
  if (b.varietyId && src.varietyId && src.varietyId !== b.varietyId) return `Lô nguồn ${src.code} thuộc giống khác`;
  if (!["Đạt", "Đã chứng nhận"].includes(src.status)) return `Lô nguồn ${src.code} chưa đạt kiểm định (${src.status})`;
  return validateLevelChain(src.level, b.level ?? "");
}
