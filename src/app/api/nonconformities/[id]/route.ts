import { nonconformityStore } from "@/lib/data/qms";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(nonconformityStore);
