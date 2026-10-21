import { germplasmStore, type Germplasm } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Germplasm>(
  germplasmStore,
  {
    code: "",
    kind: "Cây trồng",
    species: "",
    localName: "",
    collectedAt: "",
    collectionSite: "",
    conservation: "Đồng ruộng",
    quantity: "",
    evaluation: "",
    status: "Đang lưu giữ",
    note: "",
  },
  (b) => (!b.code ? "Thiếu số đăng ký nguồn gen" : !b.species ? "Thiếu loài" : null),
);
