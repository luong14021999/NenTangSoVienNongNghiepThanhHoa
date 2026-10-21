import { breedTrialStore, type BreedTrial } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<BreedTrial>(
  breedTrialStore,
  {
    code: "",
    varietyId: "",
    kind: "Khảo nghiệm VCU",
    site: "",
    season: "",
    startAt: "",
    endAt: "",
    yield: "",
    result: "Đang theo dõi",
    leader: "",
    standardId: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã khảo nghiệm" : !b.varietyId ? "Chọn giống khảo nghiệm" : null),
);
