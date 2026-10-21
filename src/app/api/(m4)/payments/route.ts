import { paymentStore, type Payment } from "@/lib/modules/m4/data/sales";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Payment>(
  paymentStore,
  {
    code: "",
    contractId: "",
    paidAt: "",
    amount: 0,
    method: "Chuyển khoản",
    invoiceNo: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu số chứng từ" : !b.contractId ? "Chọn hợp đồng" : !(Number(b.amount) > 0) ? "Số tiền phải lớn hơn 0" : null),
);
