import { paymentStore } from "@/lib/modules/m4/data/sales";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(paymentStore);
