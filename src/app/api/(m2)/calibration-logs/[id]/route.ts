import { calibrationLogStore } from "@/lib/modules/m2/data/calibration-logs";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(calibrationLogStore);
export const DELETE = deleteRoute(calibrationLogStore);
