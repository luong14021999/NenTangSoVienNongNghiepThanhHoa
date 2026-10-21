import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { toolUsageLogs, type ToolUsageLog } from "@/lib/mock-data";

export const toolUsageLogStore = createEntityStore<ToolUsageLog>(
  "tool-usage-logs",
  toolUsageLogs,
  {
    table: "tool_usage_logs",
    select: "id, item_name, qty, unit, imported_at, status, used_by, note",
    toEntity: (r) => ({
      id: r.id as string,
      itemName: (r.item_name as string) ?? "",
      qty: (r.qty as number) ?? 0,
      unit: (r.unit as string) ?? "",
      importedAt: (r.imported_at as string) ?? "",
      status: (r.status as string) ?? "",
      user: (r.used_by as string) ?? "",
      note: (r.note as string) ?? "",
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.itemName !== undefined) r.item_name = e.itemName;
      if (e.qty !== undefined) r.qty = e.qty;
      if (e.unit !== undefined) r.unit = e.unit;
      if (e.importedAt !== undefined) r.imported_at = dateOrNull(e.importedAt);
      if (e.status !== undefined) r.status = e.status;
      if (e.user !== undefined) r.used_by = e.user;
      if (e.note !== undefined) r.note = e.note;
      return r;
    },
  },
);
