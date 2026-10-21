import { testRequestsStore } from "@/lib/modules/m2/data/test-requests";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { TestRequest } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(testRequestsStore);

export const POST = createRoute<TestRequest>(
  testRequestsStore,
  (body) => ({
    id: "",
    code: body.code ?? "",
    customer: body.customer ?? "",
    customerCode: body.customerCode ?? "",
    contact: body.contact ?? "",
    phone: body.phone ?? "",
    matrix: body.matrix ?? "",
    expectedSamples: body.expectedSamples ?? 1,
    criteria: body.criteria ?? [],
    purpose: body.purpose ?? "",
    decisionRule: body.decisionRule ?? "Simple acceptance",
    expectedDeliveryDays: body.expectedDeliveryDays ?? 7,
    vatRate: body.vatRate ?? 0,
    notes: body.notes,
    status: body.status ?? "Yêu cầu mới",
    createdAt:
      body.createdAt ??
      new Date().toISOString().slice(0, 16).replace("T", " "),
    quotedAt: body.quotedAt,
    acceptedAt: body.acceptedAt,
    contractCode: body.contractCode,
    linkedSampleCodes: body.linkedSampleCodes,
  }),
  (body) => {
    if (!body.code) return "Thiếu mã yêu cầu";
    if (!body.customer) return "Thiếu khách hàng";
    if (!body.matrix) return "Thiếu loại mẫu";
    return null;
  },
);
