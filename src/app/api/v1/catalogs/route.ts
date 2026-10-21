import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/data/integration";
import { listCatalogs } from "@/lib/data/mdm";

export const dynamic = "force-dynamic";

export const GET = withApiKey("catalogs:read", async () => {
  const items = (await listCatalogs()).map(({ code, name, description, source, updatedAt, active }) => ({ code, name, description, source, updatedAt, activeItems: active }));
  return NextResponse.json({ count: items.length, items });
});
