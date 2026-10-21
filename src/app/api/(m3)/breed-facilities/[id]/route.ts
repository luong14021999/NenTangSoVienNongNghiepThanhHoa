import { facilityStore } from "@/lib/modules/m3/data/genomics";
import { itemRoutes } from "@/lib/platform/api/crud";
import { validateCoordinates } from "@/lib/modules/m3/genomics";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(facilityStore, { validate: (m) => validateCoordinates(m.latitude, m.longitude) });
