import { cultureBatchStore, type CultureBatch } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<CultureBatch>(
  cultureBatchStore,
  {
    code: "",
    materialId: "",
    recipeId: "",
    stage: "Nhân nhanh",
    subcultureNo: 0,
    startedAt: "",
    nextTransferAt: "",
    vessels: 0,
    contaminated: 0,
    plantlets: 0,
    room: "",
    operator: "",
    status: "Đang nuôi",
    note: "",
  },
  (b) =>
    !b.code ? "Thiếu mã mẻ cấy" : Number(b.contaminated) > Number(b.vessels) ? "Số bình nhiễm không được lớn hơn số bình cấy" : null,
);
