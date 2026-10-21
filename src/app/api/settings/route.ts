import { NextResponse } from "next/server";
import { authorize } from "@/lib/data/access";
import { logChange } from "@/lib/data/change-log";
import { SETTINGS, coerceSetting, getSettings, setSetting, type SettingKey } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const gate = await authorize("admin.system");
  if (!gate.ok) return gate.response;
  const body = (await req.json()) as Record<string, unknown>;
  const before = await getSettings();
  const changes: { field: string; old: string; new: string }[] = [];
  for (const [k, raw] of Object.entries(body)) {
    if (!(k in SETTINGS)) continue;
    const c = coerceSetting(k, raw);
    if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
    const old = before[k as SettingKey];
    if (JSON.stringify(old) === JSON.stringify(c.value)) continue;
    await setSetting(k as SettingKey, c.value, gate.actor.name);
    changes.push({ field: k, old: JSON.stringify(old), new: JSON.stringify(c.value) });
  }
  if (changes.length) await logChange({ entity: "settings", entityId: "system", action: "Sửa cấu hình", label: changes.map((c) => c.field).join(", "), changes, actor: gate.actor.name });
  return NextResponse.json({ ok: true, changed: changes.length });
}
