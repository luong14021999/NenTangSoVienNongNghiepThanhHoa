import {
  neon,
  types,
  type NeonQueryFunction,
} from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

let client: NeonQueryFunction<false, false> | null = null;

// Giữ định dạng giống Supabase (PostgREST) để các toEntity hiện có không đổi:
// date → "YYYY-MM-DD", timestamptz → ISO string, numeric/int8 → number.
const OID = { int8: 20, numeric: 1700, date: 1082, timestamp: 1114, timestamptz: 1184 };
const parseNumber = (v: string) => Number(v);
const parsers: Record<number, (v: string) => unknown> = {
  [OID.int8]: parseNumber,
  [OID.numeric]: parseNumber,
  [OID.date]: (v) => v,
  [OID.timestamp]: (v) => v.replace(" ", "T"),
  // "2024-01-15 08:30:00+07" → "2024-01-15T08:30:00+07:00"
  [OID.timestamptz]: (v) => v.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"),
};
const customTypes = {
  getTypeParser: ((id: number, format?: "text" | "binary") =>
    parsers[id] ?? types.getTypeParser(id, format)) as typeof types.getTypeParser,
};

function getSql() {
  if (!DATABASE_URL) {
    throw new Error("Thiếu DATABASE_URL trong .env.local");
  }
  client ??= neon(DATABASE_URL);
  return client;
}

/**
 * Chạy câu lệnh tham số hoá trên Neon (HTTP). Chỉ dùng server-side.
 * `types` phải truyền theo từng query – driver bỏ qua option này ở neon().
 */
export function dbQuery(text: string, params: unknown[] = []) {
  return getSql().query(text, params, { types: customTypes });
}

export function isDbConfigured() {
  return Boolean(DATABASE_URL);
}

/** Quote identifier Postgres (tên bảng / cột). */
export const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;
