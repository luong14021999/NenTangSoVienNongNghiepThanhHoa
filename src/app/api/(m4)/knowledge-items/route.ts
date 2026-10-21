import { knowledgeStore, type KnowledgeItem } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<KnowledgeItem>(
  knowledgeStore,
  {
    code: "",
    kind: "Quy trình kỹ thuật",
    title: "",
    abstract: "",
    content: "",
    keywords: "",
    externalAuthors: "",
    taskId: "",
    fieldTrialId: "",
    publishedAt: "",
    source: "",
    url: "",
    isPublic: false,
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã tài liệu" : !b.title ? "Thiếu tiêu đề" : (b.content ?? "").length > 200_000 ? "Nội dung toàn văn quá dài (tối đa 200.000 ký tự)" : b.url && !safeUrl(b.url) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
);
