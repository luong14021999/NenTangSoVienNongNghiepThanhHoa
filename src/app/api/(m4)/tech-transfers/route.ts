import { techTransferStore, type TechTransfer } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<TechTransfer>(
  techTransferStore,
  {
    code: "",
    title: "",
    partnerId: "",
    ipAssetId: "",
    taskId: "",
    form: "Chuyển giao quyền sử dụng",
    contractNo: "",
    signedAt: "",
    value: 0,
    handoverAt: "",
    handoverNote: "",
    status: "Đang đàm phán",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã" : !b.title ? "Thiếu nội dung chuyển giao" : b.status === "Đã bàn giao" && !b.handoverAt ? "Đã bàn giao cần có ngày biên bản bàn giao" : null),
);
