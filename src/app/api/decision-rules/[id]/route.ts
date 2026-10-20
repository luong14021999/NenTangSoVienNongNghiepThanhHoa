import { NextResponse } from "next/server";
import { decisionRuleStore, zonesOf } from "@/lib/data/quality";
import { deleteRoute } from "@/lib/api/crud";
import type { DecisionRule } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const num = (v: unknown) => (v === undefined || v === "" || v === null ? undefined : Number(v));

/** Sửa quy tắc → tính lại ngưỡng vùng quyết định từ bản ghi sau khi trộn. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  return NextResponse.json({ ok: true, item });
}

export const DELETE = deleteRoute(decisionRuleStore);
