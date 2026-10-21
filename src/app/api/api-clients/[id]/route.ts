import { NextResponse } from "next/server";
import { authorize } from "@/lib/data/access";
import { logChange } from "@/lib/data/change-log";
import { deleteApiClient, updateApiClient } from "@/lib/data/integration";
import { API_SCOPES } from "@/lib/integration/api-keys";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as { active?: boolean | string; scopes?: string[]; rateLimit?: number | string; expiresAt?: string; note?: string };
  const active = b.active === undefined ? undefined : b.active === true || b.active === "true" || b.active === "Đạt";
  const scopes = b.scopes?.filter((s) => s in API_SCOPES);
  const rateLimit = b.rateLimit === undefined || b.rateLimit === "" ? undefined : Number(b.rateLimit);
  const r = await updateApiClient((await params).id, { active, scopes, rateLimit, expiresAt: b.expiresAt, note: b.note });
  if (!r) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  await logChange({ entity: "api-clients", entityId: r.id as string, action: active === false ? "Vô hiệu hóa khóa API" : "Sửa khóa API", label: r.name as string, actor: gate.actor.name });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  const id = (await params).id;
  const r = await deleteApiClient(id);
  if (!r) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  await logChange({ entity: "api-clients", entityId: id, action: "Thu hồi khóa API", label: r.name as string, actor: gate.actor.name });
  return NextResponse.json({ ok: true });
}
