import { NextResponse } from "next/server";
import { authorize } from "@/lib/data/access";
import { logChange } from "@/lib/data/change-log";
import { MDM_STATUSES, createItem, listCatalogs, listItems, validateItem, type MdmItem } from "@/lib/data/mdm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const catalog = new URL(req.url).searchParams.get("catalog");
  if (!catalog) return NextResponse.json({ items: await listCatalogs() });
  const items = await listItems(catalog);
  return NextResponse.json({ count: items.length, items });
}

export async function POST(req: Request) {
  const gate = await authorize("write.mdm");
  if (!gate.ok) return gate.response;
  const b = (await req.json()) as Partial<MdmItem> & { attrsText?: string };
  const catalog = String(b.catalogCode ?? "");
  if (!(await listCatalogs()).some((c) => c.code === catalog)) return NextResponse.json({ error: `Không có danh mục ${catalog}` }, { status: 400 });
  const err = validateItem(b, await listItems(catalog));
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  if (b.status && !MDM_STATUSES.includes(b.status)) return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  let attrs = b.attrs;
  if (b.attrsText) {
    try {
      attrs = JSON.parse(b.attrsText);
    } catch {
      return NextResponse.json({ error: "Thuộc tính phải là JSON hợp lệ" }, { status: 400 });
    }
  }
  const item = await createItem(catalog, { ...b, attrs }, gate.actor.name);
  await logChange({ entity: "mdm-items", entityId: item.id, action: "Thêm", label: `${catalog}/${item.code} – ${item.name}`, actor: gate.actor.name });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
