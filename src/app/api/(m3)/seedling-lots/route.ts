import { seedlingLotStore, type SeedlingLot } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { validateGrading } from "@/lib/modules/m3/production";

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
    orderId: "",
    nurseryBed: "",
    readyAt: "",
    grade1Qty: 0,
    grade2Qty: 0,
    rejectQty: 0,
    note: "",
  },
  (b) =>
    !b.code
      ? "Thiếu mã lô"
      : validateGrading({
          quantity: Number(b.quantity) || 0,
          survived: Number(b.survived) || 0,
          grade1Qty: Number(b.grade1Qty) || 0,
          grade2Qty: Number(b.grade2Qty) || 0,
          rejectQty: Number(b.rejectQty) || 0,
        }),
);
