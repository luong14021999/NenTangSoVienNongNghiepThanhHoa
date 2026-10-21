import { NextResponse } from "next/server";
import { individualStore, type Individual } from "@/lib/modules/m3/data/breeding";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { checkParents } from "./check";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<Individual>(
  individualStore,
  { code: "", stockId: "", varietyId: "", sex: "—", bornAt: "", sireId: "", damId: "", generation: "", status: "Đang sử dụng", note: "" },
  (b) => (!b.code ? "Thiếu số hiệu cá thể" : null),
);

export const GET = routes.GET;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Individual>;
  const err = await checkParents(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
