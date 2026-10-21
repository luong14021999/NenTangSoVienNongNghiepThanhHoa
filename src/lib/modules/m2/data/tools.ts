import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { tools, type Tool } from "@/lib/mock-data";

const SELECT =
  "id, code, name, category, spec, qty, unit, min_qty, location, calibration_required, last_calibration, next_calibration, status";

export const toolsStore = createEntityStore<Tool>("tools", tools, {
  table: "tools",
  select: SELECT,
  toEntity: (row) => ({
    id: row.id as string,
    code: (row.code as string) ?? "",
    name: (row.name as string) ?? "",
    category: (row.category as Tool["category"]) ?? "Dụng cụ cầm tay",
    spec: (row.spec as string) ?? "",
    qty: (row.qty as number) ?? 0,
    unit: (row.unit as string) ?? "cái",
    minQty: (row.min_qty as number) ?? 0,
    location: (row.location as string) ?? "",
    calibrationRequired: (row.calibration_required as boolean) ?? false,
    lastCalibration: (row.last_calibration as string) ?? undefined,
    nextCalibration: (row.next_calibration as string) ?? undefined,
    status: (row.status as Tool["status"]) ?? "Sẵn sàng",
  }),
  toRow: (t) => {
    const r: Record<string, unknown> = {};
    if (t.code !== undefined) r.code = t.code;
    if (t.name !== undefined) r.name = t.name;
    if (t.category !== undefined) r.category = t.category;
    if (t.spec !== undefined) r.spec = t.spec;
    if (t.qty !== undefined) r.qty = t.qty;
    if (t.unit !== undefined) r.unit = t.unit;
    if (t.minQty !== undefined) r.min_qty = t.minQty;
    if (t.location !== undefined) r.location = t.location;
    if (t.calibrationRequired !== undefined)
      r.calibration_required = t.calibrationRequired;
    if (t.lastCalibration !== undefined)
      r.last_calibration = dateOrNull(t.lastCalibration);
    if (t.nextCalibration !== undefined)
      r.next_calibration = dateOrNull(t.nextCalibration);
    if (t.status !== undefined) r.status = t.status;
    return r;
  },
});
