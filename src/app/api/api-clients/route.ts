import { NextResponse } from "next/server";
import { authorize } from "@/lib/data/access";
import { logChange } from "@/lib/data/change-log";
import { createApiClient, listApiClients } from "@/lib/data/integration";
import { API_SCOPES } from "@/lib/integration/api-keys";
import { getSetting } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  return NextResponse.json({ items: await listApiClients() });
}

/** Tạo khóa API – khóa đầy đủ chỉ trả về một lần trong phản hồi này. */
export async function POST(req: Request) {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as { name?: string; organization?: string; scopes?: string[]; rateLimit?: number; expiresAt?: string; note?: string };
  const scopes = (b.scopes ?? []).filter((s) => s in API_SCOPES);
  if (!b.name?.trim()) return NextResponse.json({ error: "Thiếu tên hệ thống sử dụng khóa" }, { status: 400 });
  if (!scopes.length) return NextResponse.json({ error: "Chọn ít nhất một phạm vi truy cập" }, { status: 400 });
  const rateLimit = b.rateLimit === undefined || b.rateLimit === null || String(b.rateLimit) === "" ? await getSetting("api_default_rate_limit") : Number(b.rateLimit);
  if (!Number.isFinite(rateLimit) || rateLimit < 0) return NextResponse.json({ error: "Giới hạn tần suất phải ≥ 0" }, { status: 400 });
  const { id, key } = await createApiClient(
    { name: b.name.trim(), organization: b.organization?.trim() ?? "", scopes, rateLimit, expiresAt: b.expiresAt ?? "", note: b.note ?? "" },
    gate.actor.name,
  );
  await logChange({ entity: "api-clients", entityId: id, action: "Cấp khóa API", label: `${b.name} (${scopes.join(", ")})`, actor: gate.actor.name });
  return NextResponse.json({ ok: true, id, key }, { status: 201 });
}
