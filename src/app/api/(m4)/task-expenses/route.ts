import { taskExpenseStore, type TaskExpense } from "@/lib/modules/m4/data/research";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<TaskExpense>(
  taskExpenseStore,
  {
    taskId: "",
    spentAt: "",
    category: "Vật tư – hóa chất",
    amount: 0,
    source: "Ngân sách nhà nước",
    documentNo: "",
    note: "",
  },
  (b) => (!b.taskId ? "Thiếu nhiệm vụ" : !(Number(b.amount) > 0) ? "Số tiền phải lớn hơn 0" : null),
);
