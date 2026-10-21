import { NextResponse } from "next/server";
import { cultureBatchStore, type CultureBatch } from "@/lib/modules/m3/data/tissue";
import { itemRoutes } from "@/lib/platform/api/crud";
import { checkCultureBatch } from "../check";

export const dynamic = "force-dynamic";

const routes = itemRoutes(cultureBatchStore);
export const DELETE = routes.DELETE;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Partial<CultureBatch>;
  const before = (await cultureBatchStore.list()).find((b) => b.id === id);
  if (before) {
    const err = await checkCultureBatch({ ...before, ...body, id });
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.PATCH(new Request(req.url, { method: "PATCH", headers, body: JSON.stringify(body) }), ctx);
}
