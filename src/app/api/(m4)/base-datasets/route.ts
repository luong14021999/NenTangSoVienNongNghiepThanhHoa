import { baseDatasetStore, type BaseDataset } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<BaseDataset>(
  baseDatasetStore,
  {
    code: "",
    theme: "Khí hậu",
    title: "",
    area: "",
    period: "",
    source: "",
    updateFrequency: "Hằng năm",
    url: "",
    description: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã bộ dữ liệu" : !b.title ? "Thiếu tên bộ dữ liệu" : b.url && !safeUrl(b.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
);
