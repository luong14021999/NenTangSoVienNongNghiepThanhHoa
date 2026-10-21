import { NextResponse } from "next/server";
import { lotSaleStore, type LotSale } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { checkSale } from "./check";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<LotSale>(
  lotSaleStore,
  { code: "", lotId: "", orderId: "", customerId: "", soldAt: "", quantity: 0, grade: "Loại 1", unitPrice: 0, note: "" },
  (b) => (!b.code ? "Thiếu số phiếu xuất" : !(Number(b.quantity) > 0) ? "Số cây phải lớn hơn 0" : null),
);

export const GET = routes.GET;

export async function POST(req: Request) {
  const r = await checkSale((await req.json().catch(() => ({}))) as Partial<LotSale>);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(r.value) }));
}
