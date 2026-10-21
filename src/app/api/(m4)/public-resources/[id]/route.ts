import { publicResourceStore, safeUrl } from "@/lib/modules/m4/data/portal";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(publicResourceStore, {
  validate: (m) => (m.url && !safeUrl(m.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
});
