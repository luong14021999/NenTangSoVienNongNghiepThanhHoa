import { NextResponse } from "next/server";
import { lotSaleStore, type LotSale } from "@/lib/modules/m3/data/tissue";
import { itemRoutes } from "@/lib/platform/api/crud";
import { checkSale } from "../check";

export const dynamic = "force-dynamic";

const routes = itemRoutes(lotSaleStore);
export const DELETE = routes.DELETE;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Partial<LotSale>;
  const before = (await lotSaleStore.list()).find((s) => s.id === id);
  if (before) {
    const r = await checkSale({ ...before, ...body }, id);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.PATCH(new Request(req.url, { method: "PATCH", headers, body: JSON.stringify(body) }), ctx);
}
