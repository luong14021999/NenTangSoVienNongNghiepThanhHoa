// Nhập danh mục thiết bị – dụng cụ – vật tư – hóa chất VILAS 1501 vào Neon,
// thay cho dữ liệu demo. Chạy: npm run db:import-vilas
//
// - Chỉ xoá đúng các bản ghi demo (theo mã trong mock-data) + nhật ký demo gắn với chúng.
// - Bỏ qua mã đã tồn tại → chạy lại không tạo trùng, không ghi đè dữ liệu PTN đã sửa.
// - Toàn bộ chạy trong 1 transaction.
import { config } from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import {
  chemicals as demoChemicals,
  equipments as demoEquipment,
  supplies as demoSupplies,
  tools as demoTools,
} from "../src/lib/mock-data";
import { chemicalRows, equipmentRows, supplyRows, toolRows } from "./data/vilas-1501-inventory";
config({ path: ".env.local" });

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ Thiếu DATABASE_URL trong .env.local");
  process.exit(1);
}

type Row = Record<string, unknown>;
const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toDbRow = (o: Record<string, unknown>): Row =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [snake(k), v === "" && /(At|Date|Calibration|expiry)$/.test(k) ? null : v]),
  );

const codes = (items: { code: string }[]) => items.map((i) => i.code);

async function main() {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("begin");

    const del = async (table: string, column: string, values: string[]) => {
      const { rowCount } = await client.query(
        `delete from public.${table} where ${column} = any($1::text[])`,
        [values],
      );
      console.log(`  − ${table}: ${rowCount} dòng demo`);
    };

    console.log("→ Xoá dữ liệu demo");
    const eq = codes(demoEquipment);
    const ch = codes(demoChemicals);
    await del("equipment_usage_logs", "equipment_code", eq);
    await del("maintenance_schedule", "equipment_code", eq);
    await del("chemical_usage_logs", "chemical_code", ch);
    await del("equipment", "code", eq);
    await del("chemicals", "code", ch);
    await del("tools", "code", codes(demoTools));
    await del("supplies", "code", codes(demoSupplies));

    const insert = async (table: string, items: Record<string, unknown>[]) => {
      const rows = items.map(toDbRow);
      const cols = Object.keys(rows[0]).map((c) => `"${c}"`).join(", ");
      const { rowCount } = await client.query(
        `insert into public.${table} (${cols})
         select ${cols} from json_populate_recordset(null::public.${table}, $1::json) r
         where not exists (select 1 from public.${table} x where x.code = r.code)`,
        [JSON.stringify(rows)],
      );
      console.log(`  + ${table}: ${rowCount}/${items.length}`);
    };

    console.log("→ Nhập danh mục VILAS 1501");
    await insert("equipment", equipmentRows);
    await insert("tools", toolRows);
    await insert("supplies", supplyRows);
    await insert("chemicals", chemicalRows);

    await client.query("commit");
    console.log("✅ Done.");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});
