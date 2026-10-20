import { qcPointStore } from "@/lib/data/quality";
import { collectionRoutes } from "@/lib/api/crud";
import type { QcPointRow } from "@/lib/data/quality";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<QcPointRow>(
  qcPointStore,
  {
    chartId: "",
    date: "",
    value: 0,
    technician: "",
  },
  (b) => (!b.chartId ? "Thiếu biểu đồ kiểm soát" : !b.date ? "Thiếu ngày đo" : null),
);
