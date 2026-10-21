import { NextResponse } from "next/server";
import { cultureBatchStore, type CultureBatch } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { checkCultureBatch } from "./check";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<CultureBatch>(
  cultureBatchStore,
  {
    code: "",
    materialId: "",
    recipeId: "",
    stage: "Nhân nhanh",
    subcultureNo: 0,
    startedAt: "",
    nextTransferAt: "",
    vessels: 0,
    contaminated: 0,
    plantlets: 0,
    room: "",
    operator: "",
    status: "Đang nuôi",
    parentBatchId: "",
    mediaBatchId: "",
    cabinetId: "",
    roomId: "",
    explants: 0,
    survived: 0,
    orderId: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã mẻ cấy" : null),
);

export const GET = routes.GET;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<CultureBatch>;
  const err = await checkCultureBatch(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
