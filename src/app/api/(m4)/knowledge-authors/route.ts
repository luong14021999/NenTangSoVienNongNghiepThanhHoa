import { knowledgeAuthorStore, type KnowledgeAuthor } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<KnowledgeAuthor>(
  knowledgeAuthorStore,
  {
    itemId: "",
    researcherId: "",
    role: "Tác giả",
  },
  (b) => (!b.itemId ? "Thiếu tài liệu" : !b.researcherId ? "Chọn tác giả" : null),
);
