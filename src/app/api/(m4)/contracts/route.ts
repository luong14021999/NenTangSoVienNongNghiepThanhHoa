import { contractStore, type Contract } from "@/lib/modules/m4/data/sales";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Contract>(
  contractStore,
  {
    code: "",
    customerId: "",
    quotationId: "",
    title: "",
    signedAt: "",
    startAt: "",
    endAt: "",
    value: 0,
    status: "Đang soạn",
    owner: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu số hợp đồng" : !b.title ? "Thiếu tên hợp đồng" : null),
);
