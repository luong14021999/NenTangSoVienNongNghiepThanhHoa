import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { chemicals, type Chemical } from "@/lib/mock-data";

const SELECT =
  "id, code, name, cas, unit, stock, min_stock, expiry, hazard, location, technical_spec, manufacturer, manufacture_date, received_at, storage_condition, used_for, is_reference";

export const chemicalsStore = createEntityStore<Chemical>(
  "chemicals",
  chemicals,
  {
    table: "chemicals",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      code: (row.code as string) ?? "",
      name: (row.name as string) ?? "",
      cas: (row.cas as string) ?? "—",
      unit: (row.unit as string) ?? "",
      stock: (row.stock as number) ?? 0,
      minStock: (row.min_stock as number) ?? 0,
      expiry: (row.expiry as string) ?? "",
      hazard: (row.hazard as Chemical["hazard"]) ?? "Thường",
      location: (row.location as string) ?? "",
      technicalSpec: (row.technical_spec as string) ?? "",
      manufacturer: (row.manufacturer as string) ?? "",
      manufactureDate: (row.manufacture_date as string) ?? "",
      receivedAt: (row.received_at as string) ?? "",
      storageCondition: (row.storage_condition as string) ?? "",
      usedFor: (row.used_for as string[]) ?? [],
      isReference: (row.is_reference as boolean) ?? false,
    }),
    toRow: (c) => {
      const r: Record<string, unknown> = {};
      if (c.code !== undefined) r.code = c.code;
      if (c.name !== undefined) r.name = c.name;
      if (c.cas !== undefined) r.cas = c.cas;
      if (c.unit !== undefined) r.unit = c.unit;
      if (c.stock !== undefined) r.stock = c.stock;
      if (c.minStock !== undefined) r.min_stock = c.minStock;
      if (c.expiry !== undefined) r.expiry = dateOrNull(c.expiry);
      if (c.hazard !== undefined) r.hazard = c.hazard;
      if (c.location !== undefined) r.location = c.location;
      if (c.technicalSpec !== undefined) r.technical_spec = c.technicalSpec;
      if (c.manufacturer !== undefined) r.manufacturer = c.manufacturer;
      if (c.manufactureDate !== undefined)
        r.manufacture_date = dateOrNull(c.manufactureDate);
      if (c.receivedAt !== undefined)
        r.received_at = dateOrNull(c.receivedAt);
      if (c.storageCondition !== undefined)
        r.storage_condition = c.storageCondition;
      if (c.usedFor !== undefined) r.used_for = c.usedFor;
      if (c.isReference !== undefined) r.is_reference = c.isReference;
      return r;
    },
  },
);
