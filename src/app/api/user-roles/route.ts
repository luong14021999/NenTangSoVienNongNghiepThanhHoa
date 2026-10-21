import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";
import { authorize, listUserRoles, rbacEnabled } from "@/lib/data/access";
import { currentActor } from "@/lib/auth/server";
import { ROLES, validateBootstrap, type Role } from "@/lib/permissions";
import { logChange } from "@/lib/data/change-log";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("admin.users");
  if (!gate.ok) return gate.response;
  const items = await listUserRoles();
  return NextResponse.json({ count: items.length, items });
}

/** Gán / cập nhật vai trò cho 1 tài khoản (theo email). Lần đầu = bật phân quyền. */
export async function POST(req: Request) {
  const enabled = await rbacEnabled();
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  if (enabled) {
    const gate = await authorize("admin.users");
    if (!gate.ok) return gate.response;
  }
  const b = (await req.json()) as { email?: string; fullName?: string; roles?: string[]; active?: boolean; note?: string };
  const email = (b.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  const roles = (b.roles ?? []).filter((r): r is Role => (ROLES as readonly string[]).includes(r));
  const active = b.active !== false;
  if (!enabled) {
    const err = validateBootstrap([{ email, roles }], actor.email);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  const before = (await listUserRoles()).find((u) => u.email === email);
  // Không cho tước quyền Quản trị cuối cùng.
  const admins = (await listUserRoles()).filter((u) => u.active && u.roles.includes("Quản trị") && u.email !== email);
  if (enabled && admins.length === 0 && !(active && roles.includes("Quản trị"))) {
    return NextResponse.json({ error: "Phải còn ít nhất 1 tài khoản Quản trị đang hoạt động" }, { status: 409 });
  }

  const [row] = await dbQuery(
    `insert into public.user_roles (email, full_name, roles, active, note, updated_by, updated_at)
     values ($1, $2, $3::jsonb, $4, $5, $6, now())
     on conflict (email) do update set full_name = excluded.full_name, roles = excluded.roles, active = excluded.active,
       note = excluded.note, updated_by = excluded.updated_by, updated_at = now()
     returning id`,
    [email, b.fullName?.trim() || null, JSON.stringify(roles), active, b.note?.trim() || null, actor.name],
  );
  await logChange({
    entity: "user-roles",
    entityId: row.id as string,
    action: before ? "Sửa phân quyền" : enabled ? "Thêm phân quyền" : "Bật phân quyền",
    label: email,
    actor: actor.name,
    changes: [
      { field: "vai trò", old: before?.roles.join(", ") ?? "", new: roles.join(", ") },
      ...(before && before.active !== active ? [{ field: "hoạt động", old: String(before.active), new: String(active) }] : []),
    ],
  });
  return NextResponse.json({ ok: true, item: { id: row.id, email, roles, active } }, { status: before ? 200 : 201 });
}
