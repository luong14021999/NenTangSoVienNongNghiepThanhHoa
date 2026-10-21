import { breedDemandStore, type BreedDemand } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<BreedDemand>(
  breedDemandStore,
  {
    area: "",
    season: "",
    varietyId: "",
    species: "",
    quantity: 0,
    unit: "kg",
    source: "",
    note: "",
  },
  (b) => (!b.area ? "Nhập địa phương" : !b.season ? "Nhập mùa vụ" : !(Number(b.quantity) > 0) ? "Số lượng phải lớn hơn 0" : null),
);
