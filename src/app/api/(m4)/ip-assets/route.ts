import { ipAssetStore, type IpAsset } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<IpAsset>(
  ipAssetStore,
  {
    code: "",
    kind: "Bằng bảo hộ giống cây trồng",
    title: "",
    owner: "Viện Nông nghiệp tỉnh Thanh Hóa",
    authors: "",
    taskId: "",
    applicationNo: "",
    filedAt: "",
    grantNo: "",
    grantedAt: "",
    expiresAt: "",
    status: "Đang soạn hồ sơ",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã" : !b.title ? "Thiếu tên đối tượng bảo hộ" : b.status === "Được cấp bằng" && !b.grantNo ? "Được cấp bằng cần có số văn bằng" : null),
);
