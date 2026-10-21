import { NextResponse } from "next/server";
import { currentActor } from "@/lib/auth/server";
import { createDraft, listRuleSets } from "@/lib/data/release-rules";
import { diffFields, logChange } from "@/lib/data/change-log";
import { DEFAULT_RULES, LEVELS, type Level, type ReleaseRules } from "@/lib/release-checks";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listRuleSets();
  return NextResponse.json({ count: items.length, items });
}

/** Chuẩn hoá dữ liệu gửi lên thành ReleaseRules hợp lệ. */
function sanitize(input: Partial<ReleaseRules>): ReleaseRules {
  const lvl = (v: unknown, d: Level): Level => (LEVELS.includes(v as Level) ? (v as Level) : d);
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const r = { ...DEFAULT_RULES } as Record<string, unknown>;
  for (const [k, d] of Object.entries(DEFAULT_RULES)) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof d === "string") r[k] = lvl(v, d);
    else if (k === "rsd") r[k] = { level: lvl((v as { level?: unknown })?.level, d.level), max: num((v as { max?: unknown })?.max, (d as { max: number }).max) };
    else if (k === "recovery") {
      const dd = d as { level: Level; min: number; max: number };
      const vv = (v ?? {}) as { level?: unknown; min?: unknown; max?: unknown };
      r[k] = { level: lvl(vv.level, dd.level), min: num(vv.min, dd.min), max: num(vv.max, dd.max) };
    }
  }
  return r as ReleaseRules;
}

/** Soạn phiên bản mới (Dự thảo) – chỉ có hiệu lực sau khi người khác phê duyệt. */
export async function POST(req: Request) {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { rules, note = "" } = (await req.json()) as { rules?: Partial<ReleaseRules>; note?: string };
  if (!note.trim()) return NextResponse.json({ error: "Cần ghi nội dung / lý do thay đổi" }, { status: 400 });
  const sets = await listRuleSets();
  const active = sets.find((s) => s.status === "Hiệu lực");
  const next = sanitize(rules ?? {});
  const changes = diffFields(active?.rules as unknown as Record<string, unknown> ?? {}, next as unknown as Record<string, unknown>);
  if (!changes.length) return NextResponse.json({ error: "Không có thay đổi so với phiên bản đang hiệu lực" }, { status: 400 });
  const res = await createDraft(next, note.trim(), actor.name);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 409 });
  await logChange({ entity: "release-rules", entityId: res.set.id, action: `Soạn phiên bản ${res.set.version}`, label: `Quy tắc kiểm soát v${res.set.version}`, changes, actor: actor.name });
  return NextResponse.json({ ok: true, item: res.set }, { status: 201 });
}
