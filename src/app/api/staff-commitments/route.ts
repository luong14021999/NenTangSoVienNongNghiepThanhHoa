import { staffCommitmentStore, type StaffCommitment } from "@/lib/data/competence";
import { collectionRoutes } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<StaffCommitment>(
  staffCommitmentStore,
  {
    staffName: "",
    kind: "Khách quan & bảo mật",
    signedAt: "",
    validUntil: "",
    conflictDeclared: "",
    docRef: "",
    note: "",
  },
  (b) => (!b.staffName ? "Thiếu tên nhân viên" : !b.signedAt ? "Thiếu ngày ký" : null),
);
