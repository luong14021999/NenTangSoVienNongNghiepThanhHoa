import { researcherStore, type Researcher } from "@/lib/modules/m4/data/research";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<Researcher>(
  researcherStore,
  {
    code: "",
    fullName: "",
    staffCode: "",
    birthYear: 0,
    gender: "",
    degree: "Thạc sĩ",
    academicTitle: "",
    specialty: "",
    unit: "",
    email: "",
    phone: "",
    orcid: "",
    publications: "",
    awards: "",
    status: "Đang công tác",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã" : !b.fullName ? "Thiếu họ tên" : null),
);
