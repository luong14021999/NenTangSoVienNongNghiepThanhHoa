import { markerStore, type Marker } from "@/lib/modules/m3/data/genomics";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Marker>(
  markerStore,
  {
    code: "",
    kind: "SSR",
    name: "",
    locus: "",
    primers: "",
    alleles: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã chỉ thị" : !/^[A-Za-z0-9._-]{1,40}$/.test(b.code) ? "Mã chỉ thị chỉ gồm chữ, số, . _ -" : null),
);
