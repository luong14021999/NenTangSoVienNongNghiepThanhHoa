import { inspectionRecordStore } from "@/lib/modules/m2/data/inspection-records";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(inspectionRecordStore);
export const DELETE = deleteRoute(inspectionRecordStore);
