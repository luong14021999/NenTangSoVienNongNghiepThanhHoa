import { taskMilestoneStore, type TaskMilestone } from "@/lib/modules/m4/data/research";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<TaskMilestone>(
  taskMilestoneStore,
  {
    taskId: "",
    title: "",
    deliverable: "",
    dueAt: "",
    doneAt: "",
    note: "",
  },
  (b) => (!b.taskId ? "Thiếu nhiệm vụ" : !b.title ? "Nhập nội dung mốc" : null),
);
