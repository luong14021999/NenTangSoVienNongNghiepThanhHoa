import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import {
  archivedSamples,
  type ArchivedSample,
} from "@/lib/mock-data";

const SELECT =
  "id, archive_code, original_sample_code, customer, type, archived_at, expiry_at, location, storage_condition, amount, status, qc_analysis_at, qc_note, purpose";

export const archivedSamplesStore = createEntityStore<ArchivedSample>(
  "archived-samples",
  archivedSamples,
  {
    table: "archived_samples",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      archiveCode: (row.archive_code as string) ?? "",
      originalSampleCode: (row.original_sample_code as string) ?? "",
      customer: (row.customer as string) ?? "",
      type: (row.type as string) ?? "",
      archivedAt: (row.archived_at as string) ?? "",
      expiryAt: (row.expiry_at as string) ?? "",
      location: (row.location as string) ?? "",
      storageCondition: (row.storage_condition as string) ?? "",
      amount: (row.amount as string) ?? "",
      status:
        (row.status as ArchivedSample["status"]) ?? "Đang lưu",
      qcAnalysisAt: (row.qc_analysis_at as string) ?? undefined,
      qcNote: (row.qc_note as string) ?? undefined,
      purpose: (row.purpose as string) ?? "",
    }),
    toRow: (s) => {
      const r: Record<string, unknown> = {};
      if (s.archiveCode !== undefined) r.archive_code = s.archiveCode;
      if (s.originalSampleCode !== undefined)
        r.original_sample_code = s.originalSampleCode;
      if (s.customer !== undefined) r.customer = s.customer;
      if (s.type !== undefined) r.type = s.type;
      if (s.archivedAt !== undefined)
        r.archived_at = dateOrNull(s.archivedAt);
      if (s.expiryAt !== undefined) r.expiry_at = dateOrNull(s.expiryAt);
      if (s.location !== undefined) r.location = s.location;
      if (s.storageCondition !== undefined)
        r.storage_condition = s.storageCondition;
      if (s.amount !== undefined) r.amount = s.amount;
      if (s.status !== undefined) r.status = s.status;
      if (s.qcAnalysisAt !== undefined)
        r.qc_analysis_at = dateOrNull(s.qcAnalysisAt);
      if (s.qcNote !== undefined) r.qc_note = s.qcNote || null;
      if (s.purpose !== undefined) r.purpose = s.purpose;
      return r;
    },
  },
);
