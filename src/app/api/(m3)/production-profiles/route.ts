import { productionProfileStore, type ProductionProfile } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<ProductionProfile>(
  productionProfileStore,
  {
    code: "",
    species: "",
    variety: "",
    multiplicationRate: 3,
    cycleDays: 30,
    rootingDays: 30,
    nurseryDays: 45,
    invitroSurvival: 90,
    nurserySurvival: 85,
    grade1Share: 80,
    note: "",
  },
  (b) =>
    !b.code
      ? "Thiếu mã"
      : !b.species
        ? "Thiếu loài"
        : !(Number(b.multiplicationRate) > 1)
          ? "Hệ số nhân phải lớn hơn 1"
          : [b.invitroSurvival, b.nurserySurvival, b.grade1Share].some((x) => x != null && (Number(x) <= 0 || Number(x) > 100))
            ? "Các tỷ lệ phải trong khoảng 0–100%"
            : null,
);
