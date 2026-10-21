import { productionLogStore, type ProductionLog } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<ProductionLog>(
  productionLogStore,
  {
    lotId: "",
    loggedAt: "",
    activity: "Chăm sóc",
    detail: "",
    cost: 0,
    actor: "",
  },
  (b) => (!b.lotId ? "Thiếu lô sản xuất" : !b.detail ? "Nhập nội dung" : null),
);
