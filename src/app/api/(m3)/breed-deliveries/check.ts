import { deliveryStore, seedLotStore, type Delivery } from "@/lib/modules/m3/data/breeding";
import { todayISO } from "@/lib/platform/dates";

/** Chỉ cung ứng lô đã đạt / đã chứng nhận, còn hiệu lực hợp quy, không quá lượng còn lại. */
export async function checkDelivery(b: Partial<Delivery>, excludeId?: string) {
  const [lots, deliveries] = await Promise.all([seedLotStore.list(), deliveryStore.list()]);
  const lot = lots.find((l) => l.id === b.seedLotId);
  if (!lot) return "Chọn lô giống";
  if (!["Đạt", "Đã chứng nhận"].includes(lot.status)) return `Lô ${lot.code} chưa đạt kiểm định (${lot.status}) – không được cung ứng`;
  const day = b.deliveredAt || todayISO();
  if (lot.conformityUntil && day > lot.conformityUntil) return `Chứng nhận hợp quy của lô ${lot.code} đã hết hiệu lực`;
  const given = deliveries.filter((d) => d.seedLotId === lot.id && d.id !== excludeId).reduce((s, d) => s + d.quantity, 0);
  const left = lot.quantity - given;
  if ((Number(b.quantity) || 0) > left + 1e-9) return `Lô ${lot.code} chỉ còn ${left.toLocaleString("vi-VN")} ${lot.unit}`;
  return null;
}
