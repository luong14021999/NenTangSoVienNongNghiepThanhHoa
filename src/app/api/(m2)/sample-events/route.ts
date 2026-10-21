import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { SAMPLE_EVENTS, sampleEventStore, type SampleEvent } from "@/lib/modules/m2/data/custody";
import { logChange } from "@/lib/platform/data/change-log";
import { listRoute } from "@/lib/platform/api/crud";

export const dynamic = "force-dynamic";

export const GET = listRoute(sampleEventStore);

/** Ghi sự kiện hành trình mẫu: người ghi = tài khoản đăng nhập, thời điểm = lúc ghi (§7.4). */
export async function POST(req: Request) {
  const gate = await authorize("write.reception");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<SampleEvent>;
  if (!b.sampleCode) return NextResponse.json({ error: "Thiếu mã mẫu" }, { status: 400 });
  if (!SAMPLE_EVENTS.includes(b.event as SampleEvent["event"])) return NextResponse.json({ error: "Loại sự kiện không hợp lệ" }, { status: 400 });
  if (b.event === "Bàn giao" && !b.receiver?.trim()) return NextResponse.json({ error: "Bàn giao cần ghi người nhận" }, { status: 400 });
  const created = await sampleEventStore.create({
    id: "",
    sampleCode: b.sampleCode,
    at: new Date().toISOString(),
    actor: gate.actor.name,
    event: b.event as SampleEvent["event"],
    location: b.location ?? "",
    condition: b.condition ?? "",
    receiver: b.receiver ?? "",
    note: b.note ?? "",
  });
  await logChange({ entity: "sample-events", entityId: created.id, action: `Thêm: ${created.event}`, label: created.sampleCode, actor: gate.actor.name });
  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
