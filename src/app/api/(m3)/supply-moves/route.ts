import { NextResponse } from "next/server";
import { supplyMoveStore, supplyStore, type SupplyMove } from "@/lib/modules/m3/data/tissue";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { MOVE_KINDS, stockOf } from "@/lib/modules/m3/production";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<SupplyMove>(
  supplyMoveStore,
  { supplyId: "", movedAt: "", kind: "Nhập", quantity: 0, unitPrice: 0, ref: "", actor: "", note: "" },
  (b) =>
    !b.supplyId
      ? "Chọn vật tư"
      : !(MOVE_KINDS as readonly string[]).includes(b.kind ?? "")
        ? "Loại phiếu không hợp lệ"
        : b.kind !== "Kiểm kê điều chỉnh" && !(Number(b.quantity) > 0)
          ? "Số lượng phải lớn hơn 0"
          : null,
);

export const GET = routes.GET;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<SupplyMove>;
  const supply = (await supplyStore.list()).find((s) => s.id === body.supplyId);
  if (!supply) return NextResponse.json({ error: "Không tìm thấy vật tư" }, { status: 400 });
  if (body.kind === "Xuất") {
    const stock = stockOf((await supplyMoveStore.list()).filter((m) => m.supplyId === supply.id));
    if ((Number(body.quantity) || 0) > stock + 1e-9) {
      return NextResponse.json({ error: `Không đủ tồn kho: còn ${stock.toLocaleString("vi-VN")} ${supply.unit}` }, { status: 400 });
    }
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  const res = await routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
  // Giá nhập mới nhất làm đơn giá tính giá thành.
  if (res.ok && body.kind === "Nhập" && Number(body.unitPrice) > 0) await supplyStore.update(supply.id, { unitPrice: Number(body.unitPrice) });
  return res;
}
