// M3.1.6 Giá thành lô giống – gom dữ liệu kho vật tư, định mức, lô môi trường, mẻ cấy, đơn giá cấu hình (M1).
import { cultureBatchStore, mediaBatchStore, recipeChemicalStore, supplyStore, type SeedlingLot } from "@/lib/modules/m3/data/tissue";
import { costPerPlantlet, lotCost, mediaCostPerLiter, type CostRates } from "@/lib/modules/m3/production";
import { getSetting } from "@/lib/platform/data/settings";

export async function costRates(): Promise<CostRates> {
  const [laborPerVessel, overheadPerVessel, nurseryPerPlant] = await Promise.all([
    getSetting("tissue_labor_per_vessel").catch(() => 0),
    getSetting("tissue_overhead_per_vessel").catch(() => 0),
    getSetting("tissue_nursery_per_plant").catch(() => 0),
  ]);
  return { laborPerVessel, overheadPerVessel, nurseryPerPlant };
}

/** Bộ tính giá thành dùng chung cho các trang (nạp dữ liệu 1 lần). */
export async function loadCosting() {
  const [supplies, chemicals, mediaBatches, batches, rates] = await Promise.all([
    supplyStore.list(),
    recipeChemicalStore.list(),
    mediaBatchStore.list(),
    cultureBatchStore.list(),
    costRates(),
  ]);
  const supplyById = new Map(supplies.map((s) => [s.id, s]));
  const recipeCost = new Map<string, { cost: number; missing: string[] }>();
  const perLiter = (recipeId: string) => {
    if (!recipeCost.has(recipeId)) recipeCost.set(recipeId, mediaCostPerLiter(chemicals.filter((c) => c.recipeId === recipeId), supplyById));
    return recipeCost.get(recipeId)!;
  };
  const mediaById = new Map(mediaBatches.map((m) => [m.id, m]));
  /** Chi phí hóa chất của 1 bình thuộc lô môi trường = (chi phí / lít × số lít) ÷ số bình đã rót. */
  const mediaCostPerVessel = (mediaBatchId: string) => {
    const m = mediaById.get(mediaBatchId);
    if (!m || !(m.vessels > 0)) return 0;
    return (perLiter(m.recipeId).cost * (m.volumeL || 0)) / m.vessels;
  };
  const batchMap = new Map(batches.map((b) => [b.id, b]));
  const unitCache = new Map<string, number | null>();
  const unitCost = (batchId: string) => {
    if (!unitCache.has(batchId)) unitCache.set(batchId, costPerPlantlet(batchId, batchMap, mediaCostPerVessel, rates));
    return unitCache.get(batchId)!;
  };
  return {
    rates,
    perLiter,
    mediaCostPerVessel,
    unitCost,
    lotCost: (lot: Pick<SeedlingLot, "batchId" | "quantity" | "survived">) => lotCost(lot, lot.batchId ? unitCost(lot.batchId) : null, rates),
    ratesConfigured: rates.laborPerVessel > 0 || rates.overheadPerVessel > 0 || rates.nurseryPerPlant > 0,
  };
}
