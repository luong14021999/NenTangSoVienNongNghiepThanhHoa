import { customersStore } from "@/lib/data/customers";
import { itemRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

// Qua helper CRUD chung → kiểm tra phân quyền + ghi nhật ký thay đổi.
export const { PATCH, DELETE } = itemRoutes(customersStore);
