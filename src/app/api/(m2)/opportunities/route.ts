import { opportunityStore } from "@/lib/modules/m2/data/quality";
import { collectionRoutes } from "@/lib/platform/api/crud";
import type { Opportunity } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Opportunity>(
  opportunityStore,
  {
    title: "",
    description: "",
    expectedBenefit: "",
    owner: "",
    status: "Đề xuất",
  },
  (b) => (!b.title ? "Thiếu tên cơ hội" : null),
);
