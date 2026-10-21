import { varietyDocumentStore, type VarietyDocument } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<VarietyDocument>(
  varietyDocumentStore,
  {
    varietyId: "",
    kind: "Quyết định công nhận",
    number: "",
    issuedAt: "",
    issuer: "",
    validUntil: "",
    url: "",
    note: "",
  },
  (b) => (!b.varietyId ? "Thiếu giống" : b.url && !safeUrl(b.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
);
