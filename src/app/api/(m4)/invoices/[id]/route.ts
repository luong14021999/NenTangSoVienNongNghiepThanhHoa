import { invoiceStore } from "@/lib/modules/m4/data/sales";
import { itemRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(invoiceStore, {
  validate: (m) => (m.lookupUrl && !safeUrl(m.lookupUrl) ? "Đường dẫn tra cứu phải bắt đầu bằng http:// hoặc https://" : null),
});
