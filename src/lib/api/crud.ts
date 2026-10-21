import { NextResponse } from "next/server";
import type { EntityStore } from "@/lib/data/factory";
import { diffFields, labelOf, logChange } from "@/lib/data/change-log";
import { authorize } from "@/lib/data/access";
import { permissionForEntity } from "@/lib/permissions";

type Rec = Record<string, unknown>;

type Validator<T> = (body: Partial<T>) => string | null;

export function listRoute<T extends { id: string }>(store: EntityStore<T>) {
  return async function GET() {
    const items = await store.list();
    return NextResponse.json({ count: items.length, items });
  };
}

export function createRoute<T extends { id: string }>(
  store: EntityStore<T>,
  buildItem: (body: Partial<T>) => T,
  validate?: Validator<T>,
) {
  return async function POST(req: Request) {
    const gate = await authorize(permissionForEntity(store.collection));
    if (!gate.ok) return gate.response;
    const body = (await req.json()) as Partial<T>;
    if (validate) {
      const err = validate(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }
    let item: T;
    try {
      item = buildItem(body);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    const created = await store.create(item);
    await logChange({
      entity: store.collection,
      entityId: created.id,
      action: "Thêm",
      label: labelOf(created as unknown as Rec),
    });
    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  };
}

/** Kiểm tra / bổ sung bản ghi sau khi trộn patch với bản ghi cũ (VD tính lại đường chuẩn). */
export type PatchHooks<T> = {
  validate?: (merged: T) => string | null;
  transform?: (merged: T) => Partial<T>;
};

export function patchRoute<T extends { id: string }>(store: EntityStore<T>, hooks: PatchHooks<T> = {}) {
  return async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const gate = await authorize(permissionForEntity(store.collection));
    if (!gate.ok) return gate.response;
    const { id } = await params;
    let patch = (await req.json()) as Partial<T>;
    const before = (await store.list()).find((x) => x.id === id);
    if (before && (hooks.validate || hooks.transform)) {
      const merged = { ...before, ...patch } as T;
      const err = hooks.validate?.(merged);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      try {
        patch = { ...patch, ...(hooks.transform?.(merged) ?? {}) };
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
    }
    const item = await store.update(id, patch);
    if (!item)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    // So với giá trị đã lưu (sau khi DB chuẩn hoá kiểu) để không ghi thay đổi giả.
    const changes = diffFields((before ?? {}) as Rec, Object.fromEntries(
      Object.keys(patch).map((k) => [k, (item as unknown as Rec)[k]]),
    ));
    if (changes.length) {
      await logChange({ entity: store.collection, entityId: id, action: "Sửa", label: labelOf(item as unknown as Rec), changes });
    }
    return NextResponse.json({ ok: true, item });
  };
}

export function deleteRoute<T extends { id: string }>(store: EntityStore<T>) {
  return async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const gate = await authorize(permissionForEntity(store.collection));
    if (!gate.ok) return gate.response;
    const { id } = await params;
    const before = (await store.list()).find((x) => x.id === id);
    const ok = await store.remove(id);
    if (!ok)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    await logChange({
      entity: store.collection,
      entityId: id,
      action: "Xoá",
      label: labelOf(before as unknown as Rec),
      changes: before ? [{ field: "bản ghi", old: JSON.stringify(before), new: "" }] : [],
    });
    return NextResponse.json({ ok: true });
  };
}

/** GET (list) + POST (create) cho 1 collection; body được trộn lên `defaults`. */
export function collectionRoutes<T extends { id: string }>(
  store: EntityStore<T>,
  defaults: Omit<T, "id">,
  validate?: Validator<T>,
) {
  return {
    GET: listRoute(store),
    POST: createRoute<T>(
      store,
      (body) => ({ ...defaults, ...body, id: "" }) as T,
      validate,
    ),
  };
}

/** PATCH + DELETE cho /[id]. */
export function itemRoutes<T extends { id: string }>(store: EntityStore<T>, hooks?: PatchHooks<T>) {
  return { PATCH: patchRoute(store, hooks), DELETE: deleteRoute(store) };
}
