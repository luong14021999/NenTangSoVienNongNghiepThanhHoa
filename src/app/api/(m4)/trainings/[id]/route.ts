import { trainingStore } from "@/lib/modules/m4/data/knowledge";
import { itemRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(trainingStore, {
  validate: (m) => ((m.meetingUrl && !safeUrl(m.meetingUrl)) || (m.materialsUrl && !safeUrl(m.materialsUrl)) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
});
