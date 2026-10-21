import { quotationStore, type Quotation } from "@/lib/modules/m4/data/sales";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Quotation>(
  quotationStore,
  {
    code: "",
    customerId: "",
    title: "",
    issuedAt: "",
    validUntil: "",
    amount: 0,
    vatRate: 8,
    status: "Nháp",
    preparedBy: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu số báo giá" : !b.title ? "Thiếu nội dung báo giá" : null),
);
