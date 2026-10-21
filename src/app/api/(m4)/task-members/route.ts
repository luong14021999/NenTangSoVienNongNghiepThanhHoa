import { taskMemberStore, type TaskMember } from "@/lib/modules/m4/data/research";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<TaskMember>(
  taskMemberStore,
  {
    taskId: "",
    researcherId: "",
    role: "Thành viên",
    workloadMonths: 0,
    note: "",
  },
  (b) => (!b.taskId ? "Thiếu nhiệm vụ" : !b.researcherId ? "Chọn người tham gia" : null),
);
