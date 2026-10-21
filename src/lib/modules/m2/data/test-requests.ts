import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import {
  testRequests,
  type TestRequest,
  type TestRequestStatus,
} from "@/lib/mock-data";

const SELECT =
  "id, code, customer, customer_code, contact, phone, matrix, expected_samples, criteria, purpose, decision_rule, expected_delivery_days, vat_rate, notes, status, contract_code, linked_sample_codes, created_at, quoted_at, accepted_at";

export const testRequestsStore = createEntityStore<TestRequest>(
  "test-requests",
  testRequests,
  {
    table: "test_requests",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      code: (row.code as string) ?? "",
      customer: (row.customer as string) ?? "",
      customerCode: (row.customer_code as string) ?? "",
      contact: (row.contact as string) ?? "",
      phone: (row.phone as string) ?? "",
      matrix: (row.matrix as string) ?? "",
      expectedSamples: (row.expected_samples as number) ?? 1,
      criteria: (row.criteria as TestRequest["criteria"]) ?? [],
      purpose: (row.purpose as string) ?? "",
      decisionRule: (row.decision_rule as string) ?? "Simple acceptance",
      expectedDeliveryDays: (row.expected_delivery_days as number) ?? 7,
      vatRate: (row.vat_rate as number) ?? 0,
      notes: (row.notes as string) ?? undefined,
      status: (row.status as TestRequestStatus) ?? "Yêu cầu mới",
      contractCode: (row.contract_code as string) ?? undefined,
      linkedSampleCodes: (row.linked_sample_codes as string[]) ?? undefined,
      createdAt: (row.created_at as string) ?? "",
      quotedAt: (row.quoted_at as string) ?? undefined,
      acceptedAt: (row.accepted_at as string) ?? undefined,
    }),
    toRow: (t) => {
      const r: Record<string, unknown> = {};
      if (t.code !== undefined) r.code = t.code;
      if (t.customer !== undefined) r.customer = t.customer;
      if (t.customerCode !== undefined) r.customer_code = t.customerCode;
      if (t.contact !== undefined) r.contact = t.contact;
      if (t.phone !== undefined) r.phone = t.phone;
      if (t.matrix !== undefined) r.matrix = t.matrix;
      if (t.expectedSamples !== undefined)
        r.expected_samples = t.expectedSamples;
      if (t.criteria !== undefined) r.criteria = t.criteria;
      if (t.purpose !== undefined) r.purpose = t.purpose;
      if (t.decisionRule !== undefined) r.decision_rule = t.decisionRule;
      if (t.expectedDeliveryDays !== undefined)
        r.expected_delivery_days = t.expectedDeliveryDays;
      if (t.vatRate !== undefined) r.vat_rate = t.vatRate;
      if (t.notes !== undefined) r.notes = t.notes || null;
      if (t.status !== undefined) r.status = t.status;
      if (t.contractCode !== undefined)
        r.contract_code = t.contractCode || null;
      if (t.linkedSampleCodes !== undefined)
        r.linked_sample_codes = t.linkedSampleCodes ?? [];
      if (t.quotedAt !== undefined) r.quoted_at = dateOrNull(t.quotedAt);
      if (t.acceptedAt !== undefined) r.accepted_at = dateOrNull(t.acceptedAt);
      return r;
    },
  },
);
