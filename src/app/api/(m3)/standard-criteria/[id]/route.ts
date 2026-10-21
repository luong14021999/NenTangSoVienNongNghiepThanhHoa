import { standardCriterionStore } from "@/lib/modules/m3/data/breeding";
import { itemRoutes } from "@/lib/platform/api/crud";
import { limitsOf } from "@/lib/modules/m3/breeding-rules";

export const dynamic = "force-dynamic";

export const { PATCH, DELETE } = itemRoutes(standardCriterionStore, {
  validate: (m) => {
    const l = limitsOf(m);
    return l.min != null && l.max != null && l.min > l.max ? "Ngưỡng dưới lớn hơn ngưỡng trên" : null;
  },
});
