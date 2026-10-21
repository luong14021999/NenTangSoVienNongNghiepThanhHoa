import { createEntityStore } from "../../../platform/data/factory";
import { supplies, type Supply } from "@/lib/mock-data";

export const supplyStore = createEntityStore<Supply>("supplies", supplies, {
  table: "supplies",
  select: "id, code, name, unit, qty, min_qty, location, note",
  toEntity: (r) => ({
    id: r.id as string,
    code: (r.code as string) ?? "",
    name: (r.name as string) ?? "",
    unit: (r.unit as string) ?? "",
    qty: (r.qty as number) ?? 0,
    minQty: (r.min_qty as number) ?? 0,
    location: (r.location as string) ?? "",
    note: (r.note as string) ?? "",
  }),
  toRow: (e) => {
    const r: Record<string, unknown> = {};
    if (e.code !== undefined) r.code = e.code;
    if (e.name !== undefined) r.name = e.name;
    if (e.unit !== undefined) r.unit = e.unit;
    if (e.qty !== undefined) r.qty = e.qty;
    if (e.minQty !== undefined) r.min_qty = e.minQty;
    if (e.location !== undefined) r.location = e.location;
    if (e.note !== undefined) r.note = e.note;
    return r;
  },
});
