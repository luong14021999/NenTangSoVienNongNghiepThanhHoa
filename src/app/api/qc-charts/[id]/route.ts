import { qcChartStore } from "@/lib/data/quality";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(qcChartStore);
