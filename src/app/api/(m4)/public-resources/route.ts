import { publicResourceStore, safeUrl, type PublicResource } from "@/lib/modules/m4/data/portal";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<PublicResource>(
  publicResourceStore,
  {
    code: "",
    kind: "Biểu mẫu",
    title: "",
    url: "",
    description: "",
    published: false,
    sortOrder: 0,
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã" : !b.title ? "Thiếu tiêu đề" : b.url && !safeUrl(b.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
);
