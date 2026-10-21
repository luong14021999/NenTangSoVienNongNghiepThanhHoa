import { genotypeSampleStore, type GenotypeSample } from "@/lib/modules/m3/data/genomics";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<GenotypeSample>(
  genotypeSampleStore,
  {
    code: "",
    purpose: "Giống tham chiếu",
    varietyId: "",
    seedLotId: "",
    individualId: "",
    germplasmId: "",
    labSampleCode: "",
    collectedAt: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã mẫu" : b.purpose === "Giống tham chiếu" && !b.varietyId ? "Mẫu tham chiếu phải gắn giống" : b.purpose === "Cây kiểm tra độ thuần" && !b.seedLotId ? "Cây kiểm tra độ thuần phải gắn lô giống" : null),
);
