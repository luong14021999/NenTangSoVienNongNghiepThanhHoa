import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { diffFields, logChange } from "@/lib/platform/data/change-log";
import { MDM_STATUSES, deleteItem, getItem, listItems, updateItem, validateItem, type MdmItem } from "@/lib/platform/data/mdm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.mdm");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const before = await getItem(id);
  if (!before) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const b = (await req.json()) as Partial<MdmItem> & { attrsText?: string };
  const merged = { ...before, ...b };
  const err = validateItem(merged, await listItems(before.catalogCode), id);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  if (b.status && !MDM_STATUSES.includes(b.status)) return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  let attrs = b.attrs;
  if (b.attrsText !== undefined) {
    try {
      attrs = b.attrsText.trim() ? JSON.parse(b.attrsText) : {};
    } catch {
      return NextResponse.json({ error: "Thuộc tính phải là JSON hợp lệ" }, { status: 400 });
    }
  }
  const item = await updateItem(id, { ...b, attrs }, gate.actor.name);
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const pick = (x: MdmItem) => ({ code: x.code, name: x.name, nameEn: x.nameEn, parentCode: x.parentCode, attrs: x.attrs, status: x.status, validFrom: x.validFrom });
  const changes = diffFields(pick(before), pick(item));
  if (changes.length) await logChange({ entity: "mdm-items", entityId: id, action: `Sửa (phiên bản ${item.version})`, label: `${item.catalogCode}/${item.code}`, changes, actor: gate.actor.name });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.mdm");
  if (!gate.ok) return gate.response;
  const item = await deleteItem((await params).id);
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  await logChange({ entity: "mdm-items", entityId: item.id, action: "Xoá", label: `${item.catalogCode}/${item.code}`, changes: [{ field: "bản ghi", old: JSON.stringify(item), new: "" }], actor: gate.actor.name });
  return NextResponse.json({ ok: true });
}
