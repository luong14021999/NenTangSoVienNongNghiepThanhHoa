import { cabinetStore, type Cabinet } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Cabinet>(
  cabinetStore,
  {
    code: "",
    name: "",
    room: "",
    lastMaintainedAt: "",
    lastFilterCheckAt: "",
    status: "Đang dùng",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã tủ" : !b.name ? "Thiếu tên tủ" : null),
);
