import { NextResponse } from "next/server";
import { decisionRuleStore, zonesOf } from "@/lib/modules/m2/data/quality";
import { deleteRoute } from "@/lib/platform/api/crud";
import type { DecisionRule } from "@/lib/mock-data";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { dbQuery } from "@/lib/platform/db";
import { authorize } from "@/lib/platform/data/access";

export const dynamic = "force-dynamic";

const num = (v: unknown) => (v === undefined || v === "" || v === null ? undefined : Number(v));

/** Sửa quy tắc → tính lại ngưỡng vùng quyết định từ bản ghi sau khi trộn. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.quality");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const patch = (await req.json()) as Partial<DecisionRule>;
  const current = (await decisionRuleStore.list()).find((r) => r.id === id);
  if (!current) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const merged = {
    ...current,
    ...patch,
    limit: Number(patch.limit ?? current.limit),
    limitMin: "limitMin" in patch ? num(patch.limitMin) : current.limitMin,
    uncertainty: Number(patch.uncertainty ?? current.uncertainty),
  };
  const item = await decisionRuleStore.update(id, { ...merged, ...zonesOf(merged) });
  if (!item) return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 400 });
  const changes = diffFields(current as unknown as Record<string, unknown>, item as unknown as Record<string, unknown>);
  if (changes.length) {
    // Mỗi lần thay đổi quy tắc = 1 phiên bản mới (M2.5); chi tiết cũ → mới ở nhật ký thay đổi.
    const [v] = await dbQuery(
      `update public.decision_rules set version = coalesce(version, 1) + 1 where id = $1 returning version`,
      [id],
    );
    await logChange({
      entity: "decision-rules",
      entityId: id,
      action: `Sửa → phiên bản ${v?.version ?? ""}`,
      label: `${item.criterion} trong ${item.matrix}`,
      changes,
    });
  }
  return NextResponse.json({ ok: true, item });
}

export const DELETE = deleteRoute(decisionRuleStore);
