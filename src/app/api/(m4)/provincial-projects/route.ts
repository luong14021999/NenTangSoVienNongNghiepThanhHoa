import { provincialProjectStore, type ProvincialProject } from "@/lib/modules/m4/data/research";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<ProvincialProject>(
  provincialProjectStore,
  {
    code: "",
    title: "",
    hostOrg: "",
    leader: "",
    level: "Cấp tỉnh",
    field: "",
    startYear: 0,
    endYear: 0,
    keywords: "",
    source: "Nhập tay",
    status: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã" : !b.title ? "Thiếu tên đề tài / dự án" : null),
);
