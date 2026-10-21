import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { CalibrationLog } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(calibrationLogStore);

export const POST = createRoute<CalibrationLog>(
  calibrationLogStore,
  (b) => ({
    id: "",
    equipmentCode: b.equipmentCode ?? "",
    equipmentName: b.equipmentName ?? "",
    date: b.date ?? "",
    result: b.result ?? "Đạt",
    certificate: b.certificate ?? "",
    place: b.place ?? "",
    nextDate: b.nextDate ?? "",
    technician: b.technician ?? "",
    note: b.note,
  }),
  (b) => (!b.equipmentCode ? "Thiếu mã thiết bị" : null),
);
