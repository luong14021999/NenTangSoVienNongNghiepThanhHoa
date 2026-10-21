import { selectionRecordStore, type SelectionRecord } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SelectionRecord>(
  selectionRecordStore,
  {
    individualId: "",
    stockId: "",
    measuredAt: "",
    criterion: "",
    value: null,
    unit: "",
    decision: "Theo dõi",
    note: "",
  },
  (b) => (!b.individualId && !b.stockId ? "Chọn cá thể hoặc đàn / vườn" : !b.criterion ? "Nhập chỉ tiêu" : null),
);
