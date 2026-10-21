import { NextResponse } from "next/server";
import { taskSampleStore, type TaskSample } from "@/lib/modules/m4/data/research";
import { collectionRoutes } from "@/lib/platform/api/crud";
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

const routes = collectionRoutes<TaskSample>(
  taskSampleStore,
  { taskId: "", sampleCode: "", purpose: "" },
  (b) => (!b.taskId ? "Thiếu nhiệm vụ" : !b.sampleCode ? "Nhập mã mẫu" : null),
);

export const GET = routes.GET;

/** Gắn mẫu M2 vào nhiệm vụ – mã mẫu phải có trong phòng thử nghiệm. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const code = String(body.sampleCode ?? "").trim();
  body.sampleCode = code;
  if (code && isDbConfigured()) {
    const [s] = await dbQuery(`select 1 from public.samples where code = $1`, [code]);
    if (!s) return NextResponse.json({ error: `Không có mẫu ${code} trong phòng thử nghiệm (M2)` }, { status: 400 });
  }
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return routes.POST(new Request(req.url, { method: "POST", headers, body: JSON.stringify(body) }));
}
