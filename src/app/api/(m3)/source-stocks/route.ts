import { sourceStockStore, type SourceStock } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SourceStock>(
  sourceStockStore,
  {
    code: "",
    varietyId: "",
    kind: "Cây đầu dòng",
    name: "",
    location: "",
    quantity: 0,
    recognitionNo: "",
    recognizedAt: "",
    validUntil: "",
    status: "Đang khai thác",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã" : !b.name ? "Thiếu tên" : null),
);
