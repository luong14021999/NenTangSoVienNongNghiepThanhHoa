import { NextResponse } from "next/server";
import { motherPlantStore, tissueMaterialStore, type TissueMaterial } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { validateMaterialSource } from "@/lib/modules/m3/tissue-rules";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<TissueMaterial>(
  tissueMaterialStore,
  {
    code: "",
    species: "",
    variety: "",
    source: "",
    collectedAt: "",
    explantType: "Đỉnh sinh trưởng",
    quantity: 0,
    sterilization: "",
    status: "Đang khử trùng",
    motherPlantId: "",
    note: "",
  },
  (b) => (!b.code ? "Thiếu mã vật liệu" : !b.species ? "Thiếu loài" : null),
);

export const GET = routes.GET;

/** Không nhận vật liệu từ cây mẹ có kết quả nhiễm bệnh (M3.1.1). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<TissueMaterial>;
  const mother = body.motherPlantId ? (await motherPlantStore.list()).find((m) => m.id === body.motherPlantId) : null;
  const err = validateMaterialSource(mother);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
