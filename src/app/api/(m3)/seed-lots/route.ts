import { seedLotStore, type SeedLot } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SeedLot>(
  seedLotStore,
  {
    code: "",
    varietyId: "",
    level: "Xác nhận",
    productionLotId: "",
    quantity: 0,
    unit: "kg",
    producedAt: "",
    standardId: "",
    sampleCode: "",
    fieldInspectedAt: "",
    fieldResult: "Chưa kiểm định",
    certificateNo: "",
    certifiedAt: "",
    conformityNo: "",
    conformityUntil: "",
    status: "Chờ kiểm định",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã lô giống" : !b.level ? "Chọn cấp giống" : b.status === "Đã chứng nhận" && (!b.certificateNo || !b.certifiedAt) ? "Đã chứng nhận cần số và ngày giấy chứng nhận" : null),
);
