import { motherPlantStore, type MotherPlant } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<MotherPlant>(
  motherPlantStore,
  {
    code: "",
    species: "",
    variety: "",
    germplasmId: "",
    origin: "",
    location: "",
    plantedAt: "",
    selectionCriteria: "",
    diseaseStatus: "Chưa kiểm tra",
    diseaseTestedAt: "",
    diseaseMethod: "",
    pathogens: "",
    diseaseRef: "",
    status: "Đang sử dụng",
    note: "",
  },
  (b) =>
    !b.code
      ? "Thiếu mã cây mẹ"
      : !b.species
        ? "Thiếu loài"
        : b.diseaseStatus && b.diseaseStatus !== "Chưa kiểm tra" && !b.diseaseTestedAt
          ? "Ghi ngày kiểm tra khi có kết quả sạch bệnh / nhiễm bệnh"
          : null,
);
