// M4 – báo giá, hợp đồng, thanh toán (schema m4).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";

// ── Báo giá ─────────────────────────────────────────────────────────
export const QUOTATION_STATUSES = ["Nháp", "Đã gửi", "Được chấp nhận", "Từ chối", "Hết hạn"] as const;

export type Quotation = {
  id: string;
  code: string;
  customerId: string;
  title: string;
  issuedAt: string;
  validUntil: string;
  amount: number;
  vatRate: number;
  status: (typeof QUOTATION_STATUSES)[number];
  preparedBy: string;
  note: string;
};

export const quotationStore = createEntityStore<Quotation>(
  "quotations",
  [],
  columnsMapping<Quotation>("m4.quotations", {
    code: "text",
    customerId: "ref",
    title: "text",
    issuedAt: "date",
    validUntil: "date",
    amount: "number",
    vatRate: "number",
    status: "text",
    preparedBy: "text",
    note: "text",
  }),
);

// ── Hợp đồng ────────────────────────────────────────────────────────
export const CONTRACT_STATUSES = ["Đang soạn", "Đã ký", "Đang thực hiện", "Đã nghiệm thu", "Đã thanh lý", "Hủy"] as const;

export type Contract = {
  id: string;
  code: string;
  customerId: string;
  quotationId: string;
  title: string;
  signedAt: string;
  startAt: string;
  endAt: string;
  value: number;
  status: (typeof CONTRACT_STATUSES)[number];
  owner: string;
  note: string;
};

export const contractStore = createEntityStore<Contract>(
  "contracts",
  [],
  columnsMapping<Contract>("m4.contracts", {
    code: "text",
    customerId: "ref",
    quotationId: "ref",
    title: "text",
    signedAt: "date",
    startAt: "date",
    endAt: "date",
    value: "number",
    status: "text",
    owner: "text",
    note: "text",
  }),
);

// ── Thanh toán ──────────────────────────────────────────────────────
export const PAYMENT_METHODS = ["Chuyển khoản", "Tiền mặt"] as const;

export type Payment = {
  id: string;
  code: string;
  contractId: string;
  paidAt: string;
  amount: number;
  method: (typeof PAYMENT_METHODS)[number];
  invoiceNo: string;
  note: string;
};

export const paymentStore = createEntityStore<Payment>(
  "payments",
  [],
  columnsMapping<Payment>("m4.payments", {
    code: "text",
    contractId: "ref",
    paidAt: "date",
    amount: "number",
    method: "text",
    invoiceNo: "text",
    note: "text",
  }),
);
