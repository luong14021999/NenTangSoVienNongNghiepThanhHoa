import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { chemicalUsageLogs, type ChemicalUsageLog } from "@/lib/mock-data";

export const chemicalUsageLogStore = createEntityStore<ChemicalUsageLog>(
  "chemical-usage-logs",
  chemicalUsageLogs,
  {
    table: "chemical_usage_logs",
    select:
      "id, chemical_code, chemical_name, category, qty, unit, sample_code, method, technician, used_at, remaining, purpose",
    toEntity: (r) => ({
      id: r.id as string,
      chemicalCode: (r.chemical_code as string) ?? "",
      chemicalName: (r.chemical_name as string) ?? "",
      category: (r.category as string) ?? "",
      qty: (r.qty as number) ?? 0,
      unit: (r.unit as string) ?? "",
      sampleCode: (r.sample_code as string) ?? "",
      method: (r.method as string) ?? "",
      technician: (r.technician as string) ?? "",
      usedAt: (r.used_at as string) ?? "",
      remaining: (r.remaining as number) ?? 0,
      purpose: (r.purpose as string) ?? "",
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.chemicalCode !== undefined) r.chemical_code = e.chemicalCode;
      if (e.chemicalName !== undefined) r.chemical_name = e.chemicalName;
      if (e.category !== undefined) r.category = e.category;
      if (e.qty !== undefined) r.qty = e.qty;
      if (e.unit !== undefined) r.unit = e.unit;
      if (e.sampleCode !== undefined) r.sample_code = e.sampleCode;
      if (e.method !== undefined) r.method = e.method;
      if (e.technician !== undefined) r.technician = e.technician;
      if (e.usedAt !== undefined) r.used_at = dateOrNull(e.usedAt);
      if (e.remaining !== undefined) r.remaining = e.remaining;
      if (e.purpose !== undefined) r.purpose = e.purpose;
      return r;
    },
  },
);
