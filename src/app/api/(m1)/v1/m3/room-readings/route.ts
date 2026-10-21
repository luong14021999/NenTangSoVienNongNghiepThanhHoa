import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/platform/data/integration";
import { growthRoomStore, insertReading } from "@/lib/modules/m3/data/tissue";
import { validateReading } from "@/lib/modules/m3/tissue-rules";

export const dynamic = "force-dynamic";

/**
 * Thiết bị đo phòng nuôi cấy mô (hạng mục I.1.4) gửi số liệu – khóa API phạm vi m3:readings.
 * Body: { deviceCode | roomCode, readings: [{ at?, temperature?, humidity?, light? }] } (tối đa 500 lần đo / lần gửi)
 * hoặc 1 lần đo phẳng { deviceCode, at?, temperature?, humidity?, light? }.
 */
export const POST = withApiKey("m3:readings", async (req) => {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Body phải là JSON", code: "BAD_REQUEST" }, { status: 400 });
  const deviceCode = typeof body.deviceCode === "string" ? body.deviceCode.trim() : "";
  const roomCode = typeof body.roomCode === "string" ? body.roomCode.trim() : "";
  const rooms = await growthRoomStore.list();
  const room = rooms.find((r) => (deviceCode && r.deviceCode === deviceCode) || (roomCode && r.code === roomCode));
  if (!room) return NextResponse.json({ error: "Không có phòng nuôi gắn deviceCode / roomCode này", code: "UNKNOWN_DEVICE" }, { status: 404 });
  const list = Array.isArray(body.readings) ? (body.readings as Record<string, unknown>[]) : [body];
  if (list.length === 0 || list.length > 500) return NextResponse.json({ error: "readings: 1–500 lần đo", code: "BAD_REQUEST" }, { status: 400 });
  const values = [];
  for (const [i, r] of list.entries()) {
    const v = validateReading(r);
    if ("error" in v) return NextResponse.json({ error: `readings[${i}]: ${v.error}`, code: "BAD_REQUEST" }, { status: 400 });
    values.push(v.value);
  }
  for (const v of values) await insertReading(room.id, v, "Thiết bị", deviceCode || room.deviceCode);
  return NextResponse.json({ ok: true, room: room.code, accepted: values.length }, { status: 202 });
});
