import { breedOrderStore, type BreedOrder } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<BreedOrder>(
  breedOrderStore,
  {
    code: "",
    customerId: "",
    varietyId: "",
    level: "",
    quantity: 0,
    unit: "kg",
    dueAt: "",
    season: "",
    unitPrice: 0,
    status: "Mới",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã đơn" : !b.varietyId ? "Chọn giống" : !(Number(b.quantity) > 0) ? "Số lượng phải lớn hơn 0" : null),
);
