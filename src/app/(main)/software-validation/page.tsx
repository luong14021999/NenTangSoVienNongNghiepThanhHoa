import { BadgeCheck, GitCommit, ListChecks, XCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/qms/stat-grid";
import { dbQuery, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Xác nhận giá trị sử dụng phần mềm" };

type Case = { id: string; suite: string; name: string; status: string; durationMs: number; error?: string };
type Run = {
  id: string; gitSha: string; gitDirty: boolean; gitSubject: string; appVersion: string; runAt: string; runBy: string;
  environment: string; total: number; passed: number; failed: number; durationMs: number; cases: Case[]; note: string;
};

const dt = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" });

/** Phạm vi xác nhận: nhóm ca kiểm thử ↔ chức năng ↔ yêu cầu. */
const SCOPE: { prefix: string; fn: string; req: string }[] = [
  { prefix: "TC-DR", fn: "Quy tắc quyết định, vùng guard band, kết luận sự phù hợp", req: "§7.8.6 · JCGM 106" },
  { prefix: "TC-ST", fn: "Thống kê phép lặp x̄ / SD / RSD, nhập số kiểu Việt Nam", req: "§7.5 · M2.4" },
  { prefix: "TC-PT", fn: "Đánh giá z-score thử nghiệm thành thạo", req: "§7.7.2 · ISO 13528" },
  { prefix: "TC-AC", fn: "Danh mục 59 phép thử VILAS 1501", req: "§7.2 · M2.3" },
  { prefix: "TC-RC", fn: "Kiểm soát trước phát hành: khóa thiết bị, ủy quyền, xác nhận PP, LOQ, QC, CRM", req: "M2.5 · M2.7 · §6.2 · §6.4 · §6.5" },
  { prefix: "TC-CL", fn: "Nhật ký thay đổi: chỉ ghi trường thực sự thay đổi", req: "§7.11.3 · §8.4" },
  { prefix: "TC-AU", fn: "Phân quyền theo vai trò, tách nhiệm vụ, chống tự khoá", req: "§7.11.3 · §6.2.6" },
  { prefix: "TC-SG", fn: "Chữ ký điện tử: mã băm SHA-256 phát hiện chỉnh sửa sau khi ký", req: "M2.6 · §7.11.3" },
  { prefix: "TC-FX", fn: "Bộ tính công thức an toàn (không eval), dấu phẩy thập phân, báo lỗi", req: "M2.4 · §7.11.2" },
  { prefix: "TC-CC", fn: "Đường chuẩn: hồi quy, R², s(y/x), LOD/LOQ, nội suy s(x0)", req: "M2.5 · §7.7" },
  { prefix: "TC-UN", fn: "Ngân sách độ không đảm bảo đo, kết hợp căn tổng bình phương", req: "§7.6 · GUM" },
  { prefix: "TC-IO", fn: "Đọc file dữ liệu thiết bị CSV/TXT", req: "M2.4" },
  { prefix: "TC-TF", fn: "Định dạng nhập biến, thành phần ngân sách, điểm chuẩn; kiểm tra công thức", req: "M2.4" },
  { prefix: "TC-CR", fn: "Tính kết quả toàn chuỗi: đường chuẩn → công thức → thống kê → U (đối chiếu tính độc lập)", req: "M2.4 · §7.5 · §7.6" },
];

export default async function SoftwareValidationPage() {
  const rows = isDbConfigured()
    ? await dbQuery(
        `select id, git_sha, git_dirty, git_subject, app_version, run_at, run_by, environment, total, passed, failed, duration_ms, cases, note
         from public.software_validation_runs order by run_at desc limit 50`,
      )
    : [];
  const runs: Run[] = rows.map((r) => ({
    id: r.id, gitSha: r.git_sha, gitDirty: r.git_dirty, gitSubject: r.git_subject ?? "", appVersion: r.app_version ?? "",
    runAt: r.run_at, runBy: r.run_by ?? "", environment: r.environment ?? "", total: Number(r.total), passed: Number(r.passed),
    failed: Number(r.failed), durationMs: Number(r.duration_ms), cases: (r.cases as Case[]) ?? [], note: r.note ?? "",
  }));

  const deployedSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 12);
  const deployedMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "";
  const runForDeployed = deployedSha ? runs.find((r) => r.gitSha === deployedSha && !r.gitDirty) : undefined;
  const validated = Boolean(runForDeployed && runForDeployed.failed === 0);
  const latest = runs[0];

  return (
    <>
      <Header
        title="Xác nhận giá trị sử dụng phần mềm"
        description="ISO/IEC 17025:2017 §7.11.2 – phần mềm LIMS được xác nhận chức năng trước khi đưa vào sử dụng và sau mỗi thay đổi; lưu hồ sơ theo từng phiên bản"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            {
              label: "Phiên bản đang chạy",
              value: deployedSha ? deployedSha.slice(0, 7) : "local",
              icon: GitCommit,
              accent: "bg-blue-50 text-blue-600",
              hint: deployedSha ? (deployedMsg.split("\n")[0] || "").slice(0, 60) : "môi trường phát triển",
            },
            {
              label: "Trạng thái xác nhận",
              value: deployedSha ? (validated ? "Đã xác nhận" : "Chưa xác nhận") : "—",
              icon: validated ? BadgeCheck : XCircle,
              accent: validated ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
              hint: runForDeployed ? `${runForDeployed.passed}/${runForDeployed.total} ca đạt · ${dt(runForDeployed.runAt)}` : deployedSha ? "chưa có lần chạy cho phiên bản này" : "",
            },
            { label: "Ca kiểm thử", value: latest?.total ?? 0, icon: ListChecks, accent: "bg-violet-50 text-violet-600", hint: latest ? `lần chạy gần nhất ${dt(latest.runAt)}` : "" },
            { label: "Số lần xác nhận", value: runs.length, icon: BadgeCheck, accent: "bg-amber-50 text-amber-600" },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Phạm vi xác nhận</CardTitle>
            <CardDescription>
              Các chức năng tính toán / quy tắc ảnh hưởng trực tiếp đến kết quả được kiểm thử tự động. Quy trình: sau mỗi thay đổi mã nguồn, chạy{" "}
              <code className="font-mono text-foreground">npm run validate -- --by &quot;Họ tên&quot;</code> trên phiên bản sẽ triển khai; chỉ đưa vào sử dụng khi 100% ca đạt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border divide-y">
              {SCOPE.map((s) => {
                const cs = latest?.cases.filter((c) => c.id.startsWith(s.prefix)) ?? [];
                const ok = cs.filter((c) => c.status === "Đạt").length;
                return (
                  <div key={s.prefix} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <span className="font-mono text-xs w-14">{s.prefix}</span>
                    <span className="flex-1">{s.fn}</span>
                    <span className="text-xs text-muted-foreground sm:w-56">{s.req}</span>
                    <Badge variant={cs.length && ok === cs.length ? "success" : cs.length ? "destructive" : "secondary"}>
                      {cs.length ? `${ok}/${cs.length} đạt` : "chưa chạy"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hồ sơ các lần xác nhận</CardTitle>
            <CardDescription>Mỗi lần chạy gắn với 1 phiên bản mã nguồn (git), người thực hiện, môi trường và kết quả từng ca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {runs.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">Chưa có lần xác nhận nào</div>}
            {runs.map((r) => (
              <details key={r.id} className="rounded-lg border">
                <summary className="cursor-pointer select-none px-4 py-3 flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={r.failed === 0 ? "success" : "destructive"}>{r.failed === 0 ? "Đạt" : `${r.failed} ca không đạt`}</Badge>
                  <span className="font-mono text-xs">{r.gitSha.slice(0, 7)}</span>
                  {r.gitDirty && <Badge variant="warning">có thay đổi chưa commit</Badge>}
                  {deployedSha === r.gitSha && <Badge variant="outline">đang chạy</Badge>}
                  <span className="text-xs flex-1 truncate">{r.gitSubject}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {r.passed}/{r.total} · {r.runBy} · {dt(r.runAt)}
                  </span>
                </summary>
                <div className="border-t px-4 py-3 space-y-2">
                  <div className="text-[11px] text-muted-foreground">
                    v{r.appVersion} · {r.environment} · {(r.durationMs / 1000).toFixed(1)} s{r.note && ` · ${r.note}`}
                  </div>
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground">
                      <tr className="text-left">
                        <th className="py-1 pr-2 font-medium w-20">Mã</th>
                        <th className="py-1 pr-2 font-medium">Ca kiểm thử</th>
                        <th className="py-1 font-medium w-20">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {r.cases.map((c, i) => (
                        <tr key={`${c.id}-${i}`} className="align-top">
                          <td className="py-1 pr-2 font-mono">{c.id || "—"}</td>
                          <td className="py-1 pr-2">
                            <div>{c.name}</div>
                            <div className="text-[10px] text-muted-foreground">{c.suite}</div>
                            {c.error && <pre className="mt-1 text-[10px] text-rose-700 whitespace-pre-wrap">{c.error}</pre>}
                          </td>
                          <td className={`py-1 ${c.status === "Đạt" ? "text-emerald-700" : "text-rose-700 font-medium"}`}>{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
