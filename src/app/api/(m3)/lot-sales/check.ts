import { lotSaleStore, seedlingLotStore, seedlingOrderStore, type LotSale } from "@/lib/modules/m3/data/tissue";

/** Kiểm tra phiếu xuất: số cây ≤ số cây sống còn lại của lô (trừ các phiếu khác). Trả lỗi hoặc bản đã bổ sung. */
export async function checkSale(b: Partial<LotSale>, excludeId?: string): Promise<{ error: string } | { value: Partial<LotSale> }> {
  const [lots, sales, orders] = await Promise.all([seedlingLotStore.list(), lotSaleStore.list(), seedlingOrderStore.list()]);
  const lot = lots.find((l) => l.id === b.lotId);
  if (!lot) return { error: "Chọn lô cây giống" };
  const sold = sales.filter((s) => s.lotId === lot.id && s.id !== excludeId).reduce((s, x) => s + x.quantity, 0);
  const left = (lot.survived || 0) - sold;
  if ((Number(b.quantity) || 0) > left) return { error: `Lô ${lot.code} chỉ còn ${left} cây sống chưa xuất` };
  const order = orders.find((o) => o.id === b.orderId);
  return {
    value: {
      ...b,
      customerId: b.customerId || order?.customerId || lot.customerId || "",
      unitPrice: Number(b.unitPrice) > 0 ? b.unitPrice : order?.unitPrice ?? 0,
    },
  };
}
