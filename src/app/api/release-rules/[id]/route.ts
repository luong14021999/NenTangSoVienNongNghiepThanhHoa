import { NextResponse } from "next/server";
import { discardDraft } from "@/lib/data/release-rules";
import { logChange } from "@/lib/data/change-log";

export const dynamic = "force-dynamic";

/** Chỉ huỷ được bản Dự thảo; phiên bản đã ban hành được giữ làm hồ sơ. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await discardDraft(id))) {
    return NextResponse.json({ error: "Chỉ huỷ được bản Dự thảo" }, { status: 409 });
  }
  await logChange({ entity: "release-rules", entityId: id, action: "Huỷ dự thảo", label: "Quy tắc kiểm soát" });
  return NextResponse.json({ ok: true });
}
