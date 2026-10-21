import {
  readCollection,
  writeCollection,
  appendItem,
  updateItem,
  deleteItem,
} from "@/lib/platform/storage/file-storage";
import { dbQuery, ident, isDbConfigured } from "@/lib/platform/db";

export type EntityStore<T extends { id: string }> = {
  collection: string;
  list: () => Promise<T[]>;
  create: (item: T) => Promise<T>;
  update: (id: string, patch: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  replaceAll: (items: T[]) => Promise<void>;
};

/**
 * Cấu hình mapping camelCase TS ↔ snake_case Postgres.
 * Khi cấu hình + DATABASE_URL OK → CRUD đi qua Neon, ngược lại fallback file.
 */
export type DbMapping<T> = {
  table: string;
  /** Danh sách cột, VD "id, code, name" – dùng nguyên văn trong SELECT/RETURNING. */
  select: string;
  toEntity: (row: Record<string, unknown>) => T;
  toRow: (entity: Partial<T>) => Record<string, unknown>;
};

/**
 * Convert empty string → null cho date/timestamp columns.
 * Postgres không nhận "" cho type date/timestamptz.
 */
export const dateOrNull = (v?: string | null) =>
  v && v !== "" ? v : null;

export type ColumnKind = "text" | "number" | "bool" | "date" | "json";

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const emptyOf: Record<ColumnKind, unknown> = {
  text: "",
  number: 0,
  bool: false,
  date: "",
  json: [],
};

/**
 * Sinh DbMapping từ danh sách cột camelCase → snake_case, cho các entity
 * mà mỗi field ứng đúng 1 cột cùng tên. `id` luôn được đọc, không bao giờ ghi.
 */
export function columnsMapping<T extends { id: string }>(
  table: string,
  columns: { [K in Exclude<keyof T, "id">]-?: ColumnKind },
): DbMapping<T> {
  const entries = Object.entries(columns) as [string, ColumnKind][];
  return {
    table,
    select: ["id", ...entries.map(([k]) => toSnake(k))].join(", "),
    toEntity: (row) => {
      const e: Record<string, unknown> = { id: row.id };
      for (const [k, kind] of entries) e[k] = row[toSnake(k)] ?? emptyOf[kind];
      return e as T;
    },
    toRow: (entity) => {
      const r: Record<string, unknown> = {};
      for (const [k, kind] of entries) {
        const v = (entity as Record<string, unknown>)[k];
        if (v === undefined) continue;
        r[toSnake(k)] = kind === "date" ? dateOrNull(v as string) : v;
      }
      return r;
    },
  };
}

/**
 * Truyền cả row dưới dạng 1 tham số JSON rồi để Postgres ép kiểu theo
 * định nghĩa bảng (json_populate_record) → mảng text[], jsonb, date… đều đúng.
 */
const fromJson = (table: string) =>
  `json_populate_record(null::public.${ident(table)}, $1::json)`;

export function createEntityStore<T extends { id: string }>(
  collection: string,
  mockData: T[],
  db?: DbMapping<T>,
): EntityStore<T> {
  const dbEnabled = () => Boolean(db) && isDbConfigured();

  return {
    collection,

    async list() {
      if (dbEnabled() && db) {
        try {
          const rows = await dbQuery(
            `select ${db.select} from public.${ident(db.table)}`,
          );
          return rows.map(db.toEntity);
        } catch (e) {
          console.error(
            `[${collection}] db list error:`,
            (e as Error).message,
          );
        }
      }
      return readCollection<T>(collection, mockData);
    },

    async create(item: T) {
      if (dbEnabled() && db) {
        const row = db.toRow(item);
        const cols = Object.keys(row).map(ident).join(", ");
        const [created] = await dbQuery(
          `insert into public.${ident(db.table)} (${cols})
           select ${cols} from ${fromJson(db.table)}
           returning ${db.select}`,
          [JSON.stringify(row)],
        );
        return db.toEntity(created);
      }
      return appendItem<T>(collection, item, mockData);
    },

    async update(id, patch) {
      if (dbEnabled() && db) {
        const row = db.toRow(patch);
        const cols = Object.keys(row).map(ident).join(", ");
        const table = `public.${ident(db.table)}`;
        try {
          const [updated] = cols
            ? await dbQuery(
                `update ${table} set (${cols}) = (select ${cols} from ${fromJson(db.table)})
                 where id = $2 returning ${db.select}`,
                [JSON.stringify(row), id],
              )
            : await dbQuery(
                `select ${db.select} from ${table} where id = $1`,
                [id],
              );
          return updated ? db.toEntity(updated) : null;
        } catch (e) {
          console.error(
            `[${collection}] db update error:`,
            (e as Error).message,
          );
          return null;
        }
      }
      return updateItem<T>(collection, id, patch, mockData);
    },

    async remove(id) {
      if (dbEnabled() && db) {
        try {
          const rows = await dbQuery(
            `delete from public.${ident(db.table)} where id = $1 returning id`,
            [id],
          );
          return rows.length > 0;
        } catch (e) {
          console.error(
            `[${collection}] db delete error:`,
            (e as Error).message,
          );
          return false;
        }
      }
      return deleteItem<T>(collection, id, mockData);
    },

    replaceAll: (items) => writeCollection<T>(collection, items),
  };
}
