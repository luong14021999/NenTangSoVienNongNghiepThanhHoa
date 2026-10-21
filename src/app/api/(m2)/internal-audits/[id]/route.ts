import { internalAuditStore } from "@/lib/modules/m2/data/qms";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(internalAuditStore);
