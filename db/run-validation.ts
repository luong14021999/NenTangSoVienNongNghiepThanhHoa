// Chạy bộ kiểm thử tự động và lưu hồ sơ xác nhận giá trị sử dụng phần mềm (§7.11.2).
// Chạy: npm run validate -- --by "Họ tên người thực hiện" [--note "ghi chú"]
import { config } from "dotenv";
import { execSync, spawnSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const by = arg("by");
if (!by) {
  console.error('❌ Cần ghi người thực hiện: npm run validate -- --by "Họ tên"');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ Thiếu DATABASE_URL trong .env.local");
  process.exit(1);
}

const sh = (cmd: string) => execSync(cmd, { encoding: "utf-8" }).trim();
const gitSha = sh("git rev-parse --short=12 HEAD");
const gitDirty = sh("git status --porcelain").length > 0;
const gitSubject = sh("git log -1 --format=%s");
const appVersion = JSON.parse(readFileSync("package.json", "utf-8")).version as string;

type JsonAssertion = { ancestorTitles: string[]; title: string; status: string; duration?: number; failureMessages?: string[] };
type JsonReport = { numTotalTests: number; numPassedTests: number; numFailedTests: number; startTime: number; testResults: { assertionResults: JsonAssertion[]; endTime: number }[] };

const dir = mkdtempSync(path.join(tmpdir(), "lims-validate-"));
const out = path.join(dir, "vitest.json");
const t0 = Date.now();
spawnSync("npx", ["vitest", "run", "--reporter=json", `--outputFile=${out}`], { stdio: "inherit" });
const report = JSON.parse(readFileSync(out, "utf-8")) as JsonReport;
rmSync(dir, { recursive: true, force: true });

const cases = report.testResults.flatMap((f) =>
  f.assertionResults.map((a) => ({
    id: /^(TC-[A-Z]+-\d+)/.exec(a.title)?.[1] ?? "",
    suite: a.ancestorTitles.join(" › "),
    name: a.title.replace(/^TC-[A-Z]+-\d+\s*/, ""),
    status: a.status === "passed" ? "Đạt" : a.status === "failed" ? "Không đạt" : a.status,
    durationMs: Math.round(a.duration ?? 0),
    error: (a.failureMessages ?? []).join("\n").slice(0, 2000) || undefined,
  })),
);

(async () => {
  const sql = neon(url);
  const [row] = await sql.query(
    `insert into public.software_validation_runs
       (git_sha, git_dirty, git_subject, app_version, run_by, environment, total, passed, failed, duration_ms, cases, note)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12) returning run_at`,
    [
      gitSha, gitDirty, gitSubject, appVersion, by,
      `Node ${process.version} · ${process.platform} ${process.arch}`,
      report.numTotalTests, report.numPassedTests, report.numFailedTests, Date.now() - t0,
      JSON.stringify(cases), arg("note") ?? null,
    ],
  );
  const ok = report.numFailedTests === 0;
  console.log(`${ok ? "✅" : "❌"} Đã lưu hồ sơ xác nhận: ${report.numPassedTests}/${report.numTotalTests} đạt · phiên bản ${gitSha}${gitDirty ? " (có thay đổi chưa commit)" : ""} · ${row.run_at}`);
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});
