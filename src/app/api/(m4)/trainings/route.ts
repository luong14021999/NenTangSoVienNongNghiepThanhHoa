import { trainingStore, type Training } from "@/lib/modules/m4/data/knowledge";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { safeUrl } from "@/lib/modules/m4/data/portal";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Training>(
  trainingStore,
  {
    code: "",
    title: "",
    transferId: "",
    mode: "Trực tuyến",
    audience: "",
    startAt: "",
    endAt: "",
    venue: "",
    equipment: "",
    meetingUrl: "",
    trainer: "",
    planned: 0,
    attended: 0,
    materialsUrl: "",
    status: "Kế hoạch",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã lớp" : !b.title ? "Thiếu tên lớp" : (b.meetingUrl && !safeUrl(b.meetingUrl)) || (b.materialsUrl && !safeUrl(b.materialsUrl)) ? "Đường dẫn phải bắt đầu bằng http:// hoặc https://" : null),
);
