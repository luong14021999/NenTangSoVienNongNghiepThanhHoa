import { NextResponse } from "next/server";
import { deliveryStore, type Delivery } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { checkDelivery } from "./check";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<Delivery>(
  deliveryStore,
  { code: "", orderId: "", seedLotId: "", deliveredAt: "", quantity: 0, receiver: "", note: "" },
  (b) => (!b.code ? "Thiếu số phiếu giao" : !(Number(b.quantity) > 0) ? "Số lượng phải lớn hơn 0" : null),
);

export const GET = routes.GET;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Delivery>;
  const err = await checkDelivery(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
