import { interactionStore, type CustomerInteraction } from "@/lib/modules/m4/data/sales";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<CustomerInteraction>(
  interactionStore,
  {
    customerId: "",
    occurredAt: "",
    kind: "Gọi điện",
    content: "",
    staff: "",
    nextAction: "",
    nextActionAt: "",
    note: "",
  },
  (b) => (!b.customerId ? "Thiếu khách hàng" : !b.content ? "Nhập nội dung trao đổi" : null),
);
