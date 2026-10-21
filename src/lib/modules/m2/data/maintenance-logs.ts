import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { maintenanceLogs, type MaintenanceLog } from "@/lib/mock-data";

export const maintenanceLogStore = createEntityStore<MaintenanceLog>(
  "maintenance-logs",
  maintenanceLogs,
  {
    table: "maintenance_logs",
    select:
      "id, equipment_code, equipment_name, date, kind, content, vendor, technician, note",
    toEntity: (r) => ({
      id: r.id as string,
      equipmentCode: (r.equipment_code as string) ?? "",
      equipmentName: (r.equipment_name as string) ?? "",
      date: (r.date as string) ?? "",
      kind: (r.kind as MaintenanceLog["kind"]) ?? "Bảo trì định kỳ",
      content: (r.content as string) ?? "",
      vendor: (r.vendor as string) ?? "",
      technician: (r.technician as string) ?? "",
      note: (r.note as string) ?? "",
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.equipmentCode !== undefined) r.equipment_code = e.equipmentCode;
      if (e.equipmentName !== undefined) r.equipment_name = e.equipmentName;
      if (e.date !== undefined) r.date = dateOrNull(e.date);
      if (e.kind !== undefined) r.kind = e.kind;
      if (e.content !== undefined) r.content = e.content;
      if (e.vendor !== undefined) r.vendor = e.vendor;
      if (e.technician !== undefined) r.technician = e.technician;
      if (e.note !== undefined) r.note = e.note;
      return r;
    },
  },
);
