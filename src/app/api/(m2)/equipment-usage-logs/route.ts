import { equipmentUsageLogStore } from "@/lib/modules/m2/data/equipment-usage-logs";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { EquipmentUsageLog } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(equipmentUsageLogStore);

export const POST = createRoute<EquipmentUsageLog>(
  equipmentUsageLogStore,
  (b) => ({
    id: "",
    equipmentCode: b.equipmentCode ?? "",
    equipmentName: b.equipmentName ?? "",
    technician: b.technician ?? "",
    sampleCode: b.sampleCode ?? "",
    startedAt: b.startedAt ?? "",
    durationMin: b.durationMin ?? 0,
  }),
  (b) => (!b.equipmentCode ? "Thiếu mã thiết bị" : null),
);
