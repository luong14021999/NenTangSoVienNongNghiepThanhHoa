import { archivedSamplesStore } from "@/lib/modules/m2/data/archived-samples";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { ArchivedSample } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(archivedSamplesStore);

export const POST = createRoute<ArchivedSample>(
  archivedSamplesStore,
  (body) => ({
    id: "",
    archiveCode: body.archiveCode ?? "",
    originalSampleCode: body.originalSampleCode ?? "",
    customer: body.customer ?? "",
    type: body.type ?? "",
    archivedAt: body.archivedAt ?? new Date().toISOString().slice(0, 10),
    expiryAt: body.expiryAt ?? "",
    location: body.location ?? "",
    storageCondition: body.storageCondition ?? "",
    amount: body.amount ?? "",
    status: body.status ?? "Đang lưu",
    qcAnalysisAt: body.qcAnalysisAt,
    qcNote: body.qcNote,
    purpose: body.purpose ?? "",
  }),
  (body) => {
    if (!body.archiveCode) return "Thiếu mã mẫu lưu";
    if (!body.originalSampleCode) return "Thiếu mã mẫu gốc";
    if (!body.type) return "Thiếu loại mẫu";
    return null;
  },
);
