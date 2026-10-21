import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import {
  environmentReadings,
  type EnvironmentReading,
} from "@/lib/mock-data";

const SELECT =
  "id, room, monitoring_device, parameter, value, unit, limit_text, recorded_at, observer, pass, note";

export const environmentStore = createEntityStore<EnvironmentReading>(
  "environment",
  environmentReadings,
  {
    table: "environment_readings",
    select: SELECT,
    toEntity: (row) => ({
      id: row.id as string,
      room: (row.room as string) ?? "",
      monitoringDevice: (row.monitoring_device as string) ?? "",
      parameter:
        (row.parameter as EnvironmentReading["parameter"]) ?? "Nhiệt độ",
      value: (row.value as number) ?? 0,
      unit: (row.unit as string) ?? "",
      limit: (row.limit_text as string) ?? "",
      recordedAt: (row.recorded_at as string) ?? "",
      observer: (row.observer as string) ?? "",
      pass: (row.pass as boolean) ?? true,
      note: (row.note as string) ?? undefined,
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.room !== undefined) r.room = e.room;
      if (e.monitoringDevice !== undefined)
        r.monitoring_device = e.monitoringDevice;
      if (e.parameter !== undefined) r.parameter = e.parameter;
      if (e.value !== undefined) r.value = e.value;
      if (e.unit !== undefined) r.unit = e.unit;
      if (e.limit !== undefined) r.limit_text = e.limit;
      if (e.recordedAt !== undefined)
        r.recorded_at = dateOrNull(e.recordedAt);
      if (e.observer !== undefined) r.observer = e.observer;
      if (e.pass !== undefined) r.pass = e.pass;
      if (e.note !== undefined) r.note = e.note || null;
      return r;
    },
  },
);
