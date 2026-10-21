import { agreementStore } from "@/lib/modules/m4/data/knowledge";
import { itemRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(agreementStore, {
  validate: (m) => (m.url && !safeUrl(m.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
});
