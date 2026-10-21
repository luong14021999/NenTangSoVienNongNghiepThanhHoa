import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { equipmentUsageLogs, type EquipmentUsageLog } from "@/lib/mock-data";

export const equipmentUsageLogStore = createEntityStore<EquipmentUsageLog>(
  "equipment-usage-logs",
  equipmentUsageLogs,
  {
    table: "equipment_usage_logs",
    select:
      "id, equipment_code, equipment_name, technician, sample_code, started_at, duration_min",
    toEntity: (r) => ({
      id: r.id as string,
      equipmentCode: (r.equipment_code as string) ?? "",
      equipmentName: (r.equipment_name as string) ?? "",
      technician: (r.technician as string) ?? "",
      sampleCode: (r.sample_code as string) ?? "",
      startedAt: (r.started_at as string) ?? "",
      durationMin: (r.duration_min as number) ?? 0,
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.equipmentCode !== undefined) r.equipment_code = e.equipmentCode;
      if (e.equipmentName !== undefined) r.equipment_name = e.equipmentName;
      if (e.technician !== undefined) r.technician = e.technician;
      if (e.sampleCode !== undefined) r.sample_code = e.sampleCode;
      if (e.startedAt !== undefined) r.started_at = dateOrNull(e.startedAt);
      if (e.durationMin !== undefined) r.duration_min = e.durationMin;
      return r;
    },
  },
);
