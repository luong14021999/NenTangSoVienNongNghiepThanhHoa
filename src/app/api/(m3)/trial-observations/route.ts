import { trialObservationStore, type TrialObservation } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<TrialObservation>(
  trialObservationStore,
  {
    trialId: "",
    criterion: "",
    value: null,
    unit: "",
    note: "",
  },
  (b) => (!b.trialId ? "Thiếu khảo nghiệm" : !b.criterion ? "Nhập chỉ tiêu" : null),
);
