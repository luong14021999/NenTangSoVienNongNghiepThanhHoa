import { equipmentManualStore } from "@/lib/modules/m2/data/equipment-manuals";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { EquipmentManual } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(equipmentManualStore);

export const POST = createRoute<EquipmentManual>(
  equipmentManualStore,
  (b) => ({
    id: "",
    equipmentCode: b.equipmentCode ?? "",
    equipmentName: b.equipmentName ?? "",
    title: b.title ?? "",
    docCode: b.docCode ?? "",
    version: b.version ?? "",
    fileUrl: b.fileUrl,
    note: b.note,
  }),
  (b) => {
    if (!b.equipmentCode) return "Thiếu mã thiết bị";
    if (!b.title) return "Thiếu tên tài liệu";
    return null;
  },
);
