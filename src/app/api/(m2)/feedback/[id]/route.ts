import { feedbackStore } from "@/lib/modules/m2/data/feedback";
import { patchRoute, deleteRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const PATCH = patchRoute(feedbackStore);
export const DELETE = deleteRoute(feedbackStore);
