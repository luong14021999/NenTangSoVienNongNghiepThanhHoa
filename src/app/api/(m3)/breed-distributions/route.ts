import { distributionStore, type Distribution } from "@/lib/modules/m3/data/genomics";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Distribution>(
  distributionStore,
  {
    varietyId: "",
    district: "",
    year: new Date().getFullYear(),
    areaHa: 0,
    unit: "ha",
    source: "",
  },
  (b) => (!b.varietyId ? "Chọn giống" : !b.district ? "Nhập huyện / thị xã" : !(Number(b.year) >= 2000 && Number(b.year) <= 2100) ? "Năm không hợp lệ" : Number(b.areaHa) < 0 ? "Diện tích không được âm" : null),
);
