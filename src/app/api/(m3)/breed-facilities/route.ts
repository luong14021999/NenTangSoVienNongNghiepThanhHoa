import { facilityStore, type Facility } from "@/lib/modules/m3/data/genomics";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { validateCoordinates } from "@/lib/modules/m3/genomics";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Facility>(
  facilityStore,
  {
    code: "",
    name: "",
    kind: "Của Viện",
    owner: "",
    address: "",
    district: "",
    latitude: null,
    longitude: null,
    scale: "",
    capacity: "",
    species: "",
    conditions: "",
    inspectedAt: "",
    inspectionResult: "Chưa kiểm tra",
    certificate: "",
    status: "Đang hoạt động",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã cơ sở" : !b.name ? "Thiếu tên cơ sở" : validateCoordinates(b.latitude ?? null, b.longitude ?? null)),
);
