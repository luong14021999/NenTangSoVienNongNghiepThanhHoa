import { marketPostStore, type MarketPost } from "@/lib/modules/m3/data/genomics";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<MarketPost>(
  marketPostStore,
  {
    code: "",
    kind: "Thông tin thị trường",
    title: "",
    summary: "",
    content: "",
    varietyId: "",
    area: "",
    priceNote: "",
    publishedAt: "",
    isPublic: false,
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã tin" : !b.title ? "Thiếu tiêu đề" : (b.content ?? "").length > 20_000 ? "Nội dung quá dài (tối đa 20.000 ký tự)" : null),
);
