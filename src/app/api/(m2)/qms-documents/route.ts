import { qmsDocumentStore, type QmsDocument } from "@/lib/modules/m2/data/qms";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<QmsDocument>(
  qmsDocumentStore,
  {
    code: "",
    title: "",
    docType: "Quy trình",
    version: "",
    issuedAt: "",
    approvedBy: "",
    owner: "",
    reviewDue: "",
    status: "Hiệu lực",
    distribution: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã tài liệu" : !b.title ? "Thiếu tên tài liệu" : null),
);
