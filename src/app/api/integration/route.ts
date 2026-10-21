import { NextResponse } from "next/server";
import { authorize } from "@/lib/data/access";
import { logChange } from "@/lib/data/change-log";
import { CHANNELS, OUTBOUND_SERVICES, sendMessage, type Channel, type OutboundService } from "@/lib/integration/lgsp";
import { buildOutboundData } from "@/lib/integration/outbound";

export const dynamic = "force-dynamic";

/** Gửi một gói dữ liệu lên LGSP / NDXP (mô phỏng nếu chưa cấu hình kết nối thật). */
export async function POST(req: Request) {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as { channel?: string; service?: string; ref?: string };
  if (!CHANNELS.includes(b.channel as Channel)) return NextResponse.json({ error: "Kênh phải là LGSP hoặc NDXP" }, { status: 400 });
  if (!(String(b.service) in OUTBOUND_SERVICES)) return NextResponse.json({ error: "Dịch vụ không hỗ trợ" }, { status: 400 });
  let data: unknown;
  try {
    data = await buildOutboundData(b.service as OutboundService, b.ref ?? "");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const r = await sendMessage(b.channel as Channel, b.service!, data, gate.actor.name);
  await logChange({ entity: "integration", entityId: r.id, action: `Gửi ${b.channel} – ${r.status}`, label: `${b.service}${b.ref ? ` ${b.ref}` : ""} (${r.mode})`, actor: gate.actor.name });
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
