import { qcChartStore } from "@/lib/modules/m2/data/quality";
import { collectionRoutes } from "@/lib/platform/api/crud";
import type { QcChartRow } from "@/lib/modules/m2/data/quality";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<QcChartRow>(
  qcChartStore,
  {
    criterion: "",
    matrix: "",
    method: "",
    unit: "",
    mean: 0,
    sd: 0,
    referenceMaterial: "",
  },
  (b) => (!b.criterion ? "Thiếu chỉ tiêu" : !(Number(b.sd) > 0) ? "SD phải > 0" : null),
);
