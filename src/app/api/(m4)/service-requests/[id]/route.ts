import { serviceRequestStore } from "@/lib/modules/m4/data/portal";
import { itemRoutes } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

const routes = itemRoutes(serviceRequestStore);

export const DELETE = routes.DELETE;

/** Mã và thời điểm tạo là bằng chứng tiếp nhận – bỏ khỏi dữ liệu sửa. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  delete body.code;
  delete body.createdAt;
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  const clean = new Request(req.url, { method: "PATCH", headers, body: JSON.stringify(body) });
  return routes.PATCH(clean, ctx);
}
