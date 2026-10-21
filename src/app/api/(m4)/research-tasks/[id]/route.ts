import { researchTaskStore } from "@/lib/modules/m4/data/research";
import { itemRoutes } from "@/lib/platform/api/crud";
import { validateTask } from "@/lib/modules/m4/research";

export const dynamic = "force-dynamic";

// Đủ hồ sơ mới được chuyển trạng thái (số QĐ phê duyệt, kết quả nghiệm thu…).
export const { PATCH, DELETE } = itemRoutes(researchTaskStore, { validate: validateTask });
