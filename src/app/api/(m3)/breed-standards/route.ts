import { breedStandardStore, type BreedStandard } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<BreedStandard>(
  breedStandardStore,
  {
    code: "",
    name: "",
    kind: "Chất lượng hạt giống",
    species: "",
    level: "",
    validFrom: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu số hiệu" : !b.name ? "Thiếu tên bộ chỉ tiêu" : null),
);
