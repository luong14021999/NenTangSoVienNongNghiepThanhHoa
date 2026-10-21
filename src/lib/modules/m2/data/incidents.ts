// Sổ sự cố / sai lỗi hệ thống thông tin (ISO/IEC 17025:2017 §7.11.3 e).
import { columnsMapping, createEntityStore } from "../../../platform/data/factory";

export const INCIDENT_CATEGORIES = ["Lỗi phần mềm", "Mất / sai dữ liệu", "Truy cập trái phép", "Sự cố hạ tầng", "Khác"] as const;
export const INCIDENT_STATUSES = ["Mở", "Đang xử lý", "Đã khắc phục"] as const;

export type SystemIncident = {
  id: string;
  code: string;
  occurredAt: string;
  detectedBy: string;
  category: (typeof INCIDENT_CATEGORIES)[number];
  description: string;
  impact: string;
  action: string;
  status: (typeof INCIDENT_STATUSES)[number];
  closedAt: string;
  ncCode: string;
};

export const incidentStore = createEntityStore<SystemIncident>(
  "system-incidents",
  [],
  columnsMapping<SystemIncident>("system_incidents", {
    code: "text",
    occurredAt: "date",
    detectedBy: "text",
    category: "text",
    description: "text",
    impact: "text",
    action: "text",
    status: "text",
    closedAt: "date",
    ncCode: "text",
  }),
);
