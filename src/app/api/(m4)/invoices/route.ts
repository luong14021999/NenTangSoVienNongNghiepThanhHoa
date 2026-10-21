import { invoiceStore, type Invoice } from "@/lib/modules/m4/data/sales";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Invoice>(
  invoiceStore,
  {
    code: "",
    series: "",
    contractId: "",
    issuedAt: "",
    amount: 0,
    vatRate: 8,
    buyerName: "",
    buyerTaxCode: "",
    buyerAddress: "",
    status: "Nháp",
    provider: "Nhập tay",
    lookupCode: "",
    lookupUrl: "",
    note: "",
  },
  (b) =>
    !b.code
      ? "Thiếu số hóa đơn"
      : !b.contractId
        ? "Chọn hợp đồng"
        : b.lookupUrl && !safeUrl(b.lookupUrl)
          ? "Đường dẫn tra cứu phải bắt đầu bằng http:// hoặc https://"
          : null,
);
