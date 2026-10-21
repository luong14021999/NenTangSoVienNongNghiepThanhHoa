import { testAuthorizationStore, type TestAuthorization } from "@/lib/modules/m2/data/competence";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<TestAuthorization>(
  testAuthorizationStore,
  {
    staffName: "",
    testLabel: "",
    role: "Thực hiện phép thử",
    authorizedAt: "",
    authorizedBy: "",
    validUntil: "",
    evidence: "",
    nextMonitorAt: "",
    status: "Hiệu lực",
    note: "",
  },
  (b) => (!b.staffName ? "Thiếu nhân viên" : !b.testLabel ? "Thiếu phép thử" : null),
);
