import { inspectionRecordStore } from "@/lib/modules/m2/data/inspection-records";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { InspectionRecord } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(inspectionRecordStore);

export const POST = createRoute<InspectionRecord>(
  inspectionRecordStore,
  (b) => ({
    id: "",
    equipmentCode: b.equipmentCode ?? "",
    equipmentName: b.equipmentName ?? "",
    date: b.date ?? "",
    type: b.type ?? "Kiểm tra",
    result: b.result ?? "Đạt",
    conclusion: b.conclusion ?? "",
    inspector: b.inspector ?? "",
    note: b.note,
  }),
  (b) => (!b.equipmentCode ? "Thiếu mã thiết bị" : null),
);
