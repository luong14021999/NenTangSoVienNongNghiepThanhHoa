import { agreementStore, type Agreement } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Agreement>(
  agreementStore,
  {
    code: "",
    partnerId: "",
    kind: "Thỏa thuận hợp tác",
    title: "",
    scope: "",
    signedAt: "",
    validUntil: "",
    status: "Đang hiệu lực",
    url: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu số thỏa thuận" : !b.title ? "Thiếu tên thỏa thuận" : !b.partnerId ? "Chọn đối tác" : b.url && !safeUrl(b.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
);
