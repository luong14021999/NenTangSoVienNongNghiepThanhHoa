import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { addNotebookEntry, listNotebook } from "@/lib/modules/m2/data/custody";
import { logChange } from "@/lib/platform/data/change-log";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listNotebook();
  return NextResponse.json({ count: items.length, items });
}

/** Sổ tay thí nghiệm: chỉ ghi thêm (không có PATCH / DELETE). Đính chính = mục mới tham chiếu mục gốc. */
export async function POST(req: Request) {
  const gate = await authorize("write.lab");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Record<string, string | undefined>;
  if (!b.title?.trim() || !b.content?.trim()) return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung" }, { status: 400 });
  if (b.correctsCode) {
    const exists = (await listNotebook()).some((e) => e.code === b.correctsCode);
    if (!exists) return NextResponse.json({ error: `Không có mục ${b.correctsCode} để đính chính` }, { status: 400 });
  }
  const entry = await addNotebookEntry({
    author: gate.actor.name,
    sampleCode: b.sampleCode ?? "",
    testLabel: b.testLabel ?? "",
    title: b.title.trim(),
    content: b.content.trim(),
    equipment: b.equipment ?? "",
    conditions: b.conditions ?? "",
    correctsCode: b.correctsCode ?? "",
  });
  await logChange({ entity: "notebook", entityId: entry.id, action: entry.correctsCode ? `Đính chính ${entry.correctsCode}` : "Ghi sổ tay", label: entry.code, actor: gate.actor.name });
  return NextResponse.json({ ok: true, item: entry }, { status: 201 });
}
