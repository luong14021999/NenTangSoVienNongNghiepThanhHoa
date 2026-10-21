import { standardCriterionStore, type StandardCriterion } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { limitsOf } from "@/lib/modules/m3/breeding-rules";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<StandardCriterion>(
  standardCriterionStore,
  {
    standardId: "",
    criterion: "",
    unit: "",
    minValue: null,
    maxValue: null,
    method: "",
    sortOrder: 0,
  },
  (b) => {
    if (!b.standardId) return "Thiếu bộ chỉ tiêu";
    if (!b.criterion) return "Nhập tên chỉ tiêu";
    const l = limitsOf({ minValue: b.minValue ?? null, maxValue: b.maxValue ?? null });
    return l.min != null && l.max != null && l.min > l.max ? "Ngưỡng dưới lớn hơn ngưỡng trên" : null;
  },
);
