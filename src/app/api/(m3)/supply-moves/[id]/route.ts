import { supplyMoveStore } from "@/lib/modules/m3/data/tissue";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

// Phiếu kho chỉ xóa (sai thì xóa và lập lại) – không sửa để giữ dấu vết số lượng.
export const { DELETE } = itemRoutes(supplyMoveStore);
