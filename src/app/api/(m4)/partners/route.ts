import { partnerStore, type Partner } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Partner>(
  partnerStore,
  {
    code: "",
    name: "",
    kind: "Doanh nghiệp",
    country: "Việt Nam",
    contact: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã đối tác" : !b.name ? "Thiếu tên đối tác" : null),
);
