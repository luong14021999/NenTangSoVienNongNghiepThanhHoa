import { NextResponse } from "next/server";
import { individualStore, type Individual } from "@/lib/modules/m3/data/breeding";
import { itemRoutes } from "@/lib/platform/api/crud";
import { checkParents } from "../check";

export const dynamic = "force-dynamic";

const routes = itemRoutes(individualStore);
export const DELETE = routes.DELETE;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Partial<Individual>;
  const before = (await individualStore.list()).find((x) => x.id === id);
  if (before) {
    const err = await checkParents({ ...before, ...body, id });
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.PATCH(new Request(req.url, { method: "PATCH", headers, body: JSON.stringify(body) }), ctx);
}
