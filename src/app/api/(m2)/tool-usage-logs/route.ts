import { toolUsageLogStore } from "@/lib/modules/m2/data/tool-usage-logs";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { ToolUsageLog } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(toolUsageLogStore);

export const POST = createRoute<ToolUsageLog>(
  toolUsageLogStore,
  (b) => ({
    id: "",
    itemName: b.itemName ?? "",
    qty: b.qty ?? 0,
    unit: b.unit ?? "",
    importedAt: b.importedAt ?? "",
    status: b.status ?? "",
    user: b.user ?? "",
    note: b.note ?? "",
  }),
  (b) => (!b.itemName ? "Thiếu tên dụng cụ/vật tư" : null),
);
