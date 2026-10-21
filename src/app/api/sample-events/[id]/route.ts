import { sampleEventStore } from "@/lib/data/custody";
import { deleteRoute } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

// Sự kiện hành trình không sửa được (chỉ xoá khi ghi nhầm – có lưu vết trong nhật ký thay đổi).
export const DELETE = deleteRoute(sampleEventStore);
