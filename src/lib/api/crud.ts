import { NextResponse } from "next/server";
import type { EntityStore } from "@/lib/data/factory";

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
    const body = (await req.json()) as Partial<T>;
    if (validate) {
      const err = validate(body);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }
    const created = await store.create(buildItem(body));
    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  };
}

export function patchRoute<T extends { id: string }>(store: EntityStore<T>) {
  return async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { id } = await params;
    const patch = (await req.json()) as Partial<T>;
    const item = await store.update(id, patch);
    if (!item)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  };
}

export function deleteRoute<T extends { id: string }>(store: EntityStore<T>) {
  return async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { id } = await params;
    const ok = await store.remove(id);
    if (!ok)
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
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
export function itemRoutes<T extends { id: string }>(store: EntityStore<T>) {
  return { PATCH: patchRoute(store), DELETE: deleteRoute(store) };
}
