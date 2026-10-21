import { growthRoomStore, type GrowthRoom } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<GrowthRoom>(
  growthRoomStore,
  {
    code: "",
    name: "",
    deviceCode: "",
    tempMin: 23,
    tempMax: 27,
    humidityMin: 50,
    humidityMax: 75,
    lightMin: 2000,
    lightMax: 4000,
    photoperiod: "16 giờ sáng / 8 giờ tối",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã phòng" : !b.name ? "Thiếu tên phòng" : Number(b.tempMin) > Number(b.tempMax) || Number(b.humidityMin) > Number(b.humidityMax) || Number(b.lightMin) > Number(b.lightMax) ? "Ngưỡng dưới phải nhỏ hơn ngưỡng trên" : null),
);
