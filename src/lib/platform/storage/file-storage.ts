import { promises as fs } from "fs";
import path from "path";

// Trên Vercel, cwd read-only → ghi vào /tmp (ephemeral). Local dùng ./data (persist).
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "data")
  : path.join(process.cwd(), "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function fileOf(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

/**
 * Đọc 1 collection từ file JSON. Nếu chưa có file thì tạo từ fallback.
 * Persist xuyên qua server restart.
 */
export async function readCollection<T>(
  name: string,
  fallback: T[],
): Promise<T[]> {
  await ensureDir();
  const file = fileOf(name);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf-8");
      return fallback;
    }
    throw e;
  }
}

export async function writeCollection<T>(
  name: string,
  items: T[],
): Promise<void> {
  await ensureDir();
  await fs.writeFile(fileOf(name), JSON.stringify(items, null, 2), "utf-8");
}

export async function appendItem<T extends { id?: string }>(
  name: string,
  item: T,
  fallback: T[],
): Promise<T> {
  const items = await readCollection<T>(name, fallback);
  const withId = item.id
    ? item
    : ({
        ...item,
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      } as T);
  items.unshift(withId);
  await writeCollection(name, items);
  return withId;
}

export async function updateItem<T extends { id: string }>(
  name: string,
  id: string,
  patch: Partial<T>,
  fallback: T[],
): Promise<T | null> {
  const items = await readCollection<T>(name, fallback);
  const idx = items.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  items[idx] = { ...items[idx], ...patch };
  await writeCollection(name, items);
  return items[idx];
}

export async function deleteItem<T extends { id: string }>(
  name: string,
  id: string,
  fallback: T[],
): Promise<boolean> {
  const items = await readCollection<T>(name, fallback);
  const next = items.filter((x) => x.id !== id);
  if (next.length === items.length) return false;
  await writeCollection(name, next);
  return true;
}

export function storagePath(name: string) {
  return path.relative(process.cwd(), fileOf(name));
}
