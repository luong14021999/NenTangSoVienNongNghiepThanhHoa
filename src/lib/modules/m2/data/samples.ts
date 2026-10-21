import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { samples as mockSamples, type Sample } from "@/lib/mock-data";

const SELECT =
  "id, code, customer, type, received_at, due_at, technician, status, progress, criteria";

export const samplesStore = createEntityStore<Sample>(
  "samples",
  mockSamples,
  {
    table: "samples",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      code: (row.code as string) ?? "",
      customer: (row.customer as string) ?? "",
      type: (row.type as string) ?? "",
      receivedAt: (row.received_at as string) ?? "",
      dueAt: (row.due_at as string) ?? "",
      technician: (row.technician as string) ?? "",
      status: (row.status as Sample["status"]) ?? "Đã tiếp nhận",
      progress: (row.progress as number) ?? 0,
      criteria: (row.criteria as string[]) ?? [],
    }),
    toRow: (s) => {
      const r: Record<string, unknown> = {};
      if (s.code !== undefined) r.code = s.code;
      if (s.customer !== undefined) r.customer = s.customer;
      if (s.type !== undefined) r.type = s.type;
      if (s.receivedAt !== undefined) r.received_at = dateOrNull(s.receivedAt);
      if (s.dueAt !== undefined) r.due_at = dateOrNull(s.dueAt);
      if (s.technician !== undefined) r.technician = s.technician;
      if (s.status !== undefined) r.status = s.status;
      if (s.progress !== undefined) r.progress = s.progress;
      if (s.criteria !== undefined) r.criteria = s.criteria;
      return r;
    },
  },
);
