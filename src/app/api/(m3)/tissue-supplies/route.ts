import { supplyStore, type Supply } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Supply>(
  supplyStore,
  {
    code: "",
    name: "",
    category: "Hóa chất",
    unit: "g",
    unitPrice: 0,
    minStock: 0,
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã vật tư" : !b.name ? "Thiếu tên vật tư" : Number(b.unitPrice) < 0 ? "Đơn giá không được âm" : null),
);
