import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/platform/db";
import { authorize, listUserRoles } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("admin.users");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const all = await listUserRoles();
  const target = all.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const others = all.filter((u) => u.id !== id && u.active && u.roles.includes("Quản trị"));
  if (target.roles.includes("Quản trị") && others.length === 0) {
    return NextResponse.json({ error: "Không xoá được Quản trị cuối cùng" }, { status: 409 });
  }
  await dbQuery(`delete from public.user_roles where id = $1`, [id]);
  await logChange({
    entity: "user-roles",
    entityId: id,
    action: "Xoá phân quyền",
    label: target.email,
    actor: gate.actor.name,
    changes: [{ field: "vai trò", old: target.roles.join(", "), new: "" }],
  });
  return NextResponse.json({ ok: true });
}
