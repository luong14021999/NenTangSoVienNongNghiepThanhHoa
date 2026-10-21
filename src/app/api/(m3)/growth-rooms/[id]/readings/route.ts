import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { growthRoomStore, insertReading } from "@/lib/modules/m3/data/tissue";
import { validateReading } from "@/lib/modules/m3/tissue-rules";

export const dynamic = "force-dynamic";

/** Nhập tay 1 lần đo nhiệt độ / độ ẩm / ánh sáng (khi thiết bị chưa kết nối). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.tissue");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  if (!(await growthRoomStore.list()).some((r) => r.id === id)) return NextResponse.json({ error: "Không tìm thấy phòng nuôi" }, { status: 404 });
  const v = validateReading((await req.json().catch(() => ({}))) as Record<string, unknown>);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });
  const readingId = await insertReading(id, v.value, "Nhập tay");
  return NextResponse.json({ ok: true, id: readingId }, { status: 201 });
}
