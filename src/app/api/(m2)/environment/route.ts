import { environmentStore } from "@/lib/modules/m2/data/environment";
import { listRoute, createRoute } from "@/lib/platform/api/crud";
import type { EnvironmentReading } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export const GET = listRoute(environmentStore);

export const POST = createRoute<EnvironmentReading>(
  environmentStore,
  (body) => ({
    id: "",
    room: body.room ?? "",
    monitoringDevice: body.monitoringDevice ?? "",
    parameter: body.parameter ?? "Nhiệt độ",
    value: body.value ?? 0,
    unit: body.unit ?? "°C",
    limit: body.limit ?? "",
    recordedAt:
      body.recordedAt ??
      new Date().toISOString().slice(0, 16).replace("T", " "),
    observer: body.observer ?? "",
    pass: body.pass ?? true,
    note: body.note,
  }),
  (body) => {
    if (!body.room) return "Thiếu phòng";
    if (!body.parameter) return "Thiếu thông số";
    if (body.value === undefined || body.value === null)
      return "Thiếu giá trị đo";
    return null;
  },
);
