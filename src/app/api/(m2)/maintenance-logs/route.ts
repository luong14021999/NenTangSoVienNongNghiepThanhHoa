import { maintenanceLogStore } from "@/lib/modules/m2/data/maintenance-logs";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { MaintenanceLog } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(maintenanceLogStore);

export const POST = createRoute<MaintenanceLog>(
  maintenanceLogStore,
  (b) => ({
    id: "",
    equipmentCode: b.equipmentCode ?? "",
    equipmentName: b.equipmentName ?? "",
    date: b.date ?? "",
    kind: b.kind ?? "Bảo trì định kỳ",
    content: b.content ?? "",
    vendor: b.vendor ?? "",
    technician: b.technician ?? "",
    note: b.note,
  }),
  (b) => (!b.equipmentCode ? "Thiếu mã thiết bị" : null),
);
