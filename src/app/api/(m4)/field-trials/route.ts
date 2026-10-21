import { fieldTrialStore, type FieldTrial } from "@/lib/modules/m4/data/research";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<FieldTrial>(
  fieldTrialStore,
  {
    code: "",
    taskId: "",
    title: "",
    crop: "",
    design: "Khối ngẫu nhiên đầy đủ (RCBD)",
    treatments: 0,
    replications: 0,
    plotAreaM2: 0,
    location: "",
    latitude: 0,
    longitude: 0,
    season: "",
    startAt: "",
    endAt: "",
    lead: "",
    status: "Đang bố trí",
    results: "",
    note: "",
  },
  (b) =>
    !b.code
      ? "Thiếu mã thí nghiệm"
      : !b.title
        ? "Thiếu tên thí nghiệm"
        : Math.abs(Number(b.latitude) || 0) > 90 || Math.abs(Number(b.longitude) || 0) > 180
          ? "Tọa độ không hợp lệ"
          : null,
);
