import { seedlingLotStore, type SeedlingLot } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = collectionRoutes<SeedlingLot>(
  seedlingLotStore,
  {
    code: "",
    batchId: "",
    acclimatizedAt: "",
    quantity: 0,
    survived: 0,
    grade: "",
    customerId: "",
    releasedAt: "",
    releasedQty: 0,
    status: "Vườn ươm",
    note: "",
  },
  (b) =>
    !b.code ? "Thiếu mã lô" : Number(b.survived) > Number(b.quantity) ? "Số cây sống không được lớn hơn số cây ra ngôi" : null,
);
