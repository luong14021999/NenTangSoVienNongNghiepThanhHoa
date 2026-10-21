import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { sendMessage } from "@/lib/platform/integration/lgsp";
import { buildOutboundData } from "@/lib/platform/integration/outbound";

export const dynamic = "force-dynamic";

/** Gửi chỉ tiêu về giống cho Sở NN&MT / IOC tỉnh qua LGSP (bộ kết nối M1; mô phỏng nếu chưa cấu hình). */
export async function POST(req: Request) {
  const gate = await authorize("write.breeding");
  if (!gate.ok) return gate.response;
  const b = (await req.json().catch(() => ({}))) as { year?: number };
  const year = String(Number(b.year) || new Date().getFullYear());
  let data: unknown;
  try {
    data = await buildOutboundData("chi-tieu-giong", year);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const r = await sendMessage("LGSP", "chi-tieu-giong", data, gate.actor.name);
  await logChange({ entity: "integration", entityId: r.id, action: `Gửi LGSP – ${r.status}`, label: `chi-tieu-giong ${year} (${r.mode})`, actor: gate.actor.name });
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
