import { tissueMaterialStore, type TissueMaterial } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<TissueMaterial>(
  tissueMaterialStore,
  {
    code: "",
    species: "",
    variety: "",
    source: "",
    collectedAt: "",
    explantType: "Đỉnh sinh trưởng",
    quantity: 0,
    sterilization: "",
    status: "Đang khử trùng",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã vật liệu" : !b.species ? "Thiếu loài" : null),
);
