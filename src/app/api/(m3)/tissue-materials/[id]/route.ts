import { NextResponse } from "next/server";
import { motherPlantStore, tissueMaterialStore } from "@/lib/modules/m3/data/tissue";
import { itemRoutes } from "@/lib/platform/api/crud";
import { validateMaterialSource } from "@/lib/modules/m3/tissue-rules";

export const dynamic = "force-dynamic";

const routes = itemRoutes(tissueMaterialStore);
export const DELETE = routes.DELETE;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const body = (await req.json().catch(() => ({}))) as { motherPlantId?: string };
  if (body.motherPlantId) {
    const mother = (await motherPlantStore.list()).find((m) => m.id === body.motherPlantId);
    const err = validateMaterialSource(mother);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.PATCH(new Request(req.url, { method: "PATCH", headers, body: JSON.stringify(body) }), ctx);
}
