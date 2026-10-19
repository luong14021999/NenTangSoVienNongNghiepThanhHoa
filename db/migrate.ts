// Chạy các file db/migrations/*.sql chưa áp dụng lên Neon (theo thứ tự tên file).
// Chạy: npm run db:migrate
import { config } from "dotenv";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
config({ path: ".env.local" });

// Pool (WebSocket) hỗ trợ nhiều câu lệnh trong 1 query; Node < 22 cần ws.
neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ Thiếu DATABASE_URL trong .env.local");
  process.exit(1);
}

const dir = path.join(__dirname, "migrations");

async function main() {
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(
      `create table if not exists public._migrations (
         name text primary key,
         applied_at timestamptz default now()
       )`,
    );
    const { rows } = await pool.query<{ name: string }>(
      "select name from public._migrations",
    );
    const applied = new Set(rows.map((r) => r.name));

    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`· ${file} (đã chạy)`);
        continue;
      }
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query(readFileSync(path.join(dir, file), "utf-8"));
        await client.query("insert into public._migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.log(`✓ ${file}`);
      } catch (e) {
        await client.query("rollback");
        throw new Error(`${file}: ${(e as Error).message}`);
      } finally {
        client.release();
      }
    }
    console.log("✅ Done.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});
