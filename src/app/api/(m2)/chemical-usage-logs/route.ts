import { chemicalUsageLogStore } from "@/lib/modules/m2/data/chemical-usage-logs";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { ChemicalUsageLog } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(chemicalUsageLogStore);

export const POST = createRoute<ChemicalUsageLog>(
  chemicalUsageLogStore,
  (b) => ({
    id: "",
    chemicalCode: b.chemicalCode ?? "",
    chemicalName: b.chemicalName ?? "",
    category: b.category ?? "",
    qty: b.qty ?? 0,
    unit: b.unit ?? "",
    sampleCode: b.sampleCode ?? "",
    method: b.method ?? "",
    technician: b.technician ?? "",
    usedAt: b.usedAt ?? "",
    remaining: b.remaining ?? 0,
    purpose: b.purpose ?? "",
  }),
  (b) => (!b.chemicalCode ? "Thiếu mã hóa chất" : null),
);
