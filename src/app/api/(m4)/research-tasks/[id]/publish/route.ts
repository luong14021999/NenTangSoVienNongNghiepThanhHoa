import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { researchTaskStore } from "@/lib/modules/m4/data/research";
import { sendMessage } from "@/lib/platform/integration/lgsp";
import { buildOutboundData } from "@/lib/platform/integration/outbound";

export const dynamic = "force-dynamic";

/** Gửi thông tin nhiệm vụ lên CSDL quốc gia về KH&CN qua NDXP (bộ kết nối M1; mô phỏng nếu chưa cấu hình). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.research");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const task = (await researchTaskStore.list()).find((t) => t.id === id);
  if (!task) return NextResponse.json({ error: "Không tìm thấy nhiệm vụ" }, { status: 404 });
  let data: unknown;
  try {
    data = await buildOutboundData("nhiem-vu-khcn", task.code);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const r = await sendMessage("NDXP", "nhiem-vu-khcn", data, gate.actor.name);
  const receipt = (r.response as { maTiepNhan?: string } | null)?.maTiepNhan;
  // Chỉ lưu mã tiếp nhận khi gửi thật – mã mô phỏng không phải mã của CSDL quốc gia.
  if (r.ok && receipt && r.mode === "Thật") await researchTaskStore.update(id, { nationalRef: receipt });
  await logChange({ entity: "research-tasks", entityId: id, action: `Gửi NDXP – ${r.status}`, label: `${task.code} (${r.mode})`, actor: gate.actor.name });
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
