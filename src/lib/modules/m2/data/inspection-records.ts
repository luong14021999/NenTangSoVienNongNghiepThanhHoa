import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { inspectionRecords, type InspectionRecord } from "@/lib/mock-data";

export const inspectionRecordStore = createEntityStore<InspectionRecord>(
  "inspection-records",
  inspectionRecords,
  {
    table: "inspection_records",
    select:
      "id, equipment_code, equipment_name, date, type, result, conclusion, inspector, note",
    toEntity: (r) => ({
      id: r.id as string,
      equipmentCode: (r.equipment_code as string) ?? "",
      equipmentName: (r.equipment_name as string) ?? "",
      date: (r.date as string) ?? "",
      type: (r.type as InspectionRecord["type"]) ?? "Kiểm tra",
      result: (r.result as InspectionRecord["result"]) ?? "Đạt",
      conclusion: (r.conclusion as string) ?? "",
      inspector: (r.inspector as string) ?? "",
      note: (r.note as string) ?? "",
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.equipmentCode !== undefined) r.equipment_code = e.equipmentCode;
      if (e.equipmentName !== undefined) r.equipment_name = e.equipmentName;
      if (e.date !== undefined) r.date = dateOrNull(e.date);
      if (e.type !== undefined) r.type = e.type;
      if (e.result !== undefined) r.result = e.result;
      if (e.conclusion !== undefined) r.conclusion = e.conclusion;
      if (e.inspector !== undefined) r.inspector = e.inspector;
      if (e.note !== undefined) r.note = e.note;
      return r;
    },
  },
);
