import { NextResponse } from "next/server";
import { productionLotStore, type ProductionLot } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { checkProductionLot } from "./check";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<ProductionLot>(
  productionLotStore,
  {
    code: "",
    varietyId: "",
    level: "Xác nhận",
    sourceSeedLotId: "",
    sourceStockId: "",
    facility: "",
    season: "",
    scale: 0,
    scaleUnit: "ha",
    plannedQty: 0,
    actualQty: 0,
    unit: "kg",
    survivalPct: null,
    startedAt: "",
    harvestedAt: "",
    costTotal: 0,
    status: "Kế hoạch",
    facilityId: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã lô sản xuất" : !b.varietyId ? "Chọn giống" : !b.level ? "Chọn cấp giống" : null),
);

export const GET = routes.GET;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<ProductionLot>;
  const err = await checkProductionLot(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
