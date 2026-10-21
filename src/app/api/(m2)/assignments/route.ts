import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { assignmentStore, eligibleAssignees, type Assignment } from "@/lib/modules/m2/data/custody";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { logChange } from "@/lib/platform/data/change-log";
import { listRoute } from "@/lib/platform/api/crud";
import { testNoOf } from "@/lib/modules/m2/accreditation";

export const dynamic = "force-dynamic";

export const GET = listRoute(assignmentStore);

/** Phân công: chỉ giao cho KTV đang có ủy quyền thực hiện phép thử (M2.2, §6.2.6). */
export async function POST(req: Request) {
  const gate = await authorize("work.assign");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<Assignment>;
  if (!b.sampleCode || !b.testLabel || !Number.isFinite(testNoOf(b.testLabel))) return NextResponse.json({ error: "Thiếu mẫu hoặc phép thử" }, { status: 400 });
  if (!b.assignee) return NextResponse.json({ error: "Thiếu KTV" }, { status: 400 });
  const eligible = await eligibleAssignees(b.testLabel);
  if (!eligible.includes(b.assignee)) {
    return NextResponse.json(
      { error: `${b.assignee} chưa được ủy quyền thực hiện ${b.testLabel.split(" · ")[0]} – KTV đủ điều kiện: ${eligible.join(", ") || "chưa có ai"}` },
      { status: 400 },
    );
  }
  const dup = (await assignmentStore.list()).find(
    (a) => a.sampleCode === b.sampleCode && testNoOf(a.testLabel) === testNoOf(b.testLabel!) && a.status !== "Hủy",
  );
  if (dup) return NextResponse.json({ error: `Chỉ tiêu này đã giao cho ${dup.assignee} (${dup.status})` }, { status: 409 });
  const sample = (await samplesStore.list()).find((s) => s.code === b.sampleCode);
  const created = await assignmentStore.create({
    id: "",
    sampleCode: b.sampleCode,
    testLabel: b.testLabel,
    assignee: b.assignee,
    assignedBy: gate.actor.name,
    assignedAt: new Date().toISOString(),
    dueAt: b.dueAt || sample?.dueAt?.slice(0, 10) || "",
    status: "Đã giao",
    note: b.note ?? "",
  });
  await logChange({ entity: "assignments", entityId: created.id, action: "Phân công", label: `${created.sampleCode} → ${created.assignee}`, actor: gate.actor.name });
  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
