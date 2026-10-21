import { seedLotStore } from "@/lib/modules/m3/data/breeding";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(seedLotStore, { validate: (m) => (m.status === "Đã chứng nhận" && (!m.certificateNo || !m.certifiedAt) ? "Đã chứng nhận cần số và ngày giấy chứng nhận" : null) });
