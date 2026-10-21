import { priceItemStore, type PriceItem } from "@/lib/modules/m4/data/portal";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<PriceItem>(
  priceItemStore,
  {
    code: "",
    name: "",
    category: "Phân tích đất",
    unit: "mẫu",
    price: 0,
    turnaround: "",
    method: "",
    vilas: false,
    published: false,
    costMaterials: 0,
    costLabor: 0,
    costDepreciation: 0,
    costOverhead: 0,
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã dịch vụ" : !b.name ? "Thiếu tên dịch vụ" : Number(b.price) < 0 ? "Đơn giá không được âm" : null),
);
