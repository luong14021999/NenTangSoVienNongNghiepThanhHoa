// M4 – báo giá, hợp đồng, thanh toán, hóa đơn, chăm sóc khách hàng (schema m4).
import { columnsMapping, createEntityStore } from "@/lib/platform/data/factory";
import { QUOTATION_STATUSES } from "@/lib/modules/m4/finance";

export { QUOTATION_STATUSES };

// ── Báo giá ─────────────────────────────────────────────────────────
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
  submittedBy: string;
  submittedAt: string;
  approvedBy: string;
  approvedAt: string;
  decisionNote: string;
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
    submittedBy: "text",
    submittedAt: "date",
    approvedBy: "text",
    approvedAt: "date",
    decisionNote: "text",
    note: "text",
  }),
);

export type QuotationLine = {
  id: string;
  quotationId: string;
  priceItemId: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  unitCost: number;
  sortOrder: number;
};

export const quotationLineStore = createEntityStore<QuotationLine>(
  "quotation-lines",
  [],
  columnsMapping<QuotationLine>("m4.quotation_lines", {
    quotationId: "ref",
    priceItemId: "ref",
    description: "text",
    unit: "text",
    quantity: "number",
    unitPrice: "number",
    discountPct: "number",
    unitCost: "number",
    sortOrder: "number",
  }),
);

// ── Hợp đồng ────────────────────────────────────────────────────────
export const CONTRACT_STATUSES = ["Đang soạn", "Đã ký", "Đang thực hiện", "Đã nghiệm thu", "Đã thanh lý", "Hủy"] as const;
export const DELIVERY_METHODS = ["Trực tiếp", "Bưu điện", "Email", "Cổng trực tuyến"] as const;

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
  resultDueAt: string;
  paymentDueAt: string;
  deliveredAt: string;
  deliveryMethod: string;
  deliveryRecipient: string;
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
    resultDueAt: "date",
    paymentDueAt: "date",
    deliveredAt: "date",
    deliveryMethod: "text",
    deliveryRecipient: "text",
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

// ── Hóa đơn điện tử ─────────────────────────────────────────────────
export const INVOICE_STATUSES = ["Nháp", "Đã phát hành", "Đã thay thế", "Đã hủy"] as const;

export type Invoice = {
  id: string;
  code: string;
  series: string;
  contractId: string;
  issuedAt: string;
  amount: number;
  vatRate: number;
  buyerName: string;
  buyerTaxCode: string;
  buyerAddress: string;
  status: (typeof INVOICE_STATUSES)[number];
  provider: string;
  lookupCode: string;
  lookupUrl: string;
  note: string;
};

export const invoiceStore = createEntityStore<Invoice>(
  "invoices",
  [],
  columnsMapping<Invoice>("m4.invoices", {
    code: "text",
    series: "text",
    contractId: "ref",
    issuedAt: "date",
    amount: "number",
    vatRate: "number",
    buyerName: "text",
    buyerTaxCode: "text",
    buyerAddress: "text",
    status: "text",
    provider: "text",
    lookupCode: "text",
    lookupUrl: "text",
    note: "text",
  }),
);

// ── Chăm sóc khách hàng ─────────────────────────────────────────────
export const INTERACTION_KINDS = ["Gọi điện", "Gặp trực tiếp", "Email", "Hội thảo – tập huấn", "Khiếu nại", "Khảo sát hài lòng"] as const;

export type CustomerInteraction = {
  id: string;
  customerId: string;
  occurredAt: string;
  kind: (typeof INTERACTION_KINDS)[number];
  content: string;
  staff: string;
  nextAction: string;
  nextActionAt: string;
  note: string;
};

export const interactionStore = createEntityStore<CustomerInteraction>(
  "customer-interactions",
  [],
  columnsMapping<CustomerInteraction>("m4.customer_interactions", {
    customerId: "ref",
    occurredAt: "date",
    kind: "text",
    content: "text",
    staff: "text",
    nextAction: "text",
    nextActionAt: "date",
    note: "text",
  }),
);
