import { createEntityStore } from "../../../platform/data/factory";
import { equipmentManuals, type EquipmentManual } from "@/lib/mock-data";

export const equipmentManualStore = createEntityStore<EquipmentManual>(
  "equipment-manuals",
  equipmentManuals,
  {
    table: "equipment_manuals",
    select:
      "id, equipment_code, equipment_name, title, doc_code, version, file_url, note",
    toEntity: (r) => ({
      id: r.id as string,
      equipmentCode: (r.equipment_code as string) ?? "",
      equipmentName: (r.equipment_name as string) ?? "",
      title: (r.title as string) ?? "",
      docCode: (r.doc_code as string) ?? "",
      version: (r.version as string) ?? "",
      fileUrl: (r.file_url as string) ?? "",
      note: (r.note as string) ?? "",
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.equipmentCode !== undefined) r.equipment_code = e.equipmentCode;
      if (e.equipmentName !== undefined) r.equipment_name = e.equipmentName;
      if (e.title !== undefined) r.title = e.title;
      if (e.docCode !== undefined) r.doc_code = e.docCode;
      if (e.version !== undefined) r.version = e.version;
      if (e.fileUrl !== undefined) r.file_url = e.fileUrl;
      if (e.note !== undefined) r.note = e.note;
      return r;
    },
  },
);
