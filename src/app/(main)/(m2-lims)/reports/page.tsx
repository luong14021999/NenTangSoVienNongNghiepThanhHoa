import Link from "next/link";
import { FileText, FileCheck2, FileClock, Files } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignDialog } from "@/components/platform/sign/sign-dialog";
import { currentAccess } from "@/lib/platform/data/access";
import { StatGrid } from "@/components/common/stat-grid";
import { listReports, releaseBlockers } from "@/lib/modules/m2/data/reports";
import { listResults } from "@/lib/modules/m2/data/results";
import { samplesStore } from "@/lib/modules/m2/data/samples";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phiếu kết quả thử nghiệm" };

const dt = (iso: string) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }) : "";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string }>;
}) {
  const { sample: focus = "" } = await searchParams;
  const [reports, results, samples, access] = await Promise.all([listReports(), listResults(), samplesStore.list(), currentAccess()]);
  const email = access.actor?.email ?? "";
  const canIssue = access.can("reports.issue");
  const canRevoke = access.can("reports.revoke");

  const sampleCodes = [...new Set(results.map((r) => r.sampleCode))];
  const ready = sampleCodes
    .map((code) => {
      const rs = results.filter((r) => r.sampleCode === code);
      const approved = rs.filter((r) => r.status === "Đã duyệt");
      const active = reports.find((p) => p.sampleCode === code && p.status === "Đã phát hành");
      const s = samples.find((x) => x.code === code);
      // Có kết quả được duyệt sau lần phát hành gần nhất → cần phát hành phiếu sửa đổi.
      const newer = active ? approved.filter((r) => !active.snapshot.lines.some((l) => l.resultCode === r.resultCode)).length : 0;
      return { code, customer: s?.customer ?? rs[0]?.customerName ?? "", type: s?.type ?? "", total: rs.length, approved: approved.length, active, newer };
    })
    .filter((x) => x.approved > 0)
    .sort((a, b) => Number(b.code === focus) - Number(a.code === focus) || a.code.localeCompare(b.code));

  const active = reports.filter((r) => r.status === "Đã phát hành");
  const blocks = Object.fromEntries(
    await Promise.all(ready.map(async (x) => [x.code, (await releaseBlockers(x.code)).issues] as const)),
  );

  return (
    <>
      <Header
        title="Phiếu kết quả thử nghiệm"
        description="ISO/IEC 17025:2017 §7.8 – phát hành từ kết quả đã phê duyệt, đủ nội dung §7.8.2, lưu bản chụp, sửa đổi bằng phiếu thay thế (§7.8.8)"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Phiếu hiệu lực", value: active.length, icon: FileCheck2, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Phiếu sửa đổi", value: reports.filter((r) => r.revision > 0).length, icon: Files, accent: "bg-violet-50 text-violet-600" },
            { label: "Mẫu chờ phát hành", value: ready.filter((x) => !x.active || x.newer).length, icon: FileClock, accent: "bg-amber-50 text-amber-600" },
            { label: "Kết quả đã phê duyệt", value: results.filter((r) => r.status === "Đã duyệt").length, icon: FileText, accent: "bg-blue-50 text-blue-600" },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Mẫu có kết quả đã phê duyệt</CardTitle>
            <CardDescription>
              Phiếu chỉ gồm các kết quả đã qua đủ 3 cấp duyệt. Phát hành lại cho cùng mẫu sẽ tạo phiếu sửa đổi thay thế phiếu cũ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ready.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Chưa có kết quả nào được phê duyệt – xem <Link href="/result-entry" className="text-primary hover:underline">Nhập kết quả &amp; duyệt</Link>
              </div>
            )}
            <div className="rounded-lg border divide-y">
              {ready.map((x) => (
                <div key={x.code} className={`flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 ${x.code === focus ? "bg-primary/[0.05]" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold">{x.code}</div>
                    <div className="text-xs text-muted-foreground truncate">{x.customer} · {x.type}</div>
                  </div>
                  <div className="text-xs md:w-56">
                    <div>{x.approved}/{x.total} kết quả đã phê duyệt</div>
                    {x.total > x.approved && <div className="text-amber-700">{x.total - x.approved} kết quả chưa duyệt – không đưa vào phiếu</div>}
                    {blocks[x.code]?.length > 0 && (
                      <div className="text-rose-600 mt-0.5" title={blocks[x.code].join("\n")}>⛔ Bị chặn: {blocks[x.code][0]}{blocks[x.code].length > 1 && ` (+${blocks[x.code].length - 1})`}</div>
                    )}
                  </div>
                  <div className="text-xs md:w-60">
                    {x.active ? (
                      <>
                        <Link href={`/report-print/${x.active.id}`} className="font-mono text-primary hover:underline">{x.active.code}</Link>
                        {x.newer > 0 && <div className="text-rose-600">{x.newer} kết quả mới duyệt chưa có trong phiếu</div>}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Chưa phát hành</span>
                    )}
                  </div>
                  <SignDialog
                    email={email}
                    meaning={x.active ? "Phát hành phiếu kết quả sửa đổi" : "Phát hành phiếu kết quả"}
                    title={x.active ? `Phát hành phiếu sửa đổi – ${x.code}` : `Phát hành phiếu kết quả – ${x.code}`}
                    description={x.active ? `Phiếu mới sẽ thay thế ${x.active.code} (§7.8.8)` : "Nội dung phiếu được lưu cố định và băm SHA-256 tại thời điểm ký"}
                    endpoint="/api/test-reports"
                    extraBody={{ sampleCode: x.code }}
                    fields={[
                      { name: "note", label: x.active ? "Lý do sửa đổi / nội dung thay đổi" : "Ghi chú: sai lệch, bổ sung, loại trừ so với phương pháp; tình trạng mẫu khi nhận", required: Boolean(x.active), multiline: true },
                    ]}
                    triggerLabel={x.active ? "Phát hành sửa đổi" : "Phát hành phiếu"}
                    disabled={!canIssue || blocks[x.code]?.length > 0}
                    disabledReason={!canIssue ? "Tài khoản không có quyền phát hành phiếu" : "Bị chặn bởi quy tắc kiểm soát"}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phiếu đã phát hành</CardTitle>
            <CardDescription>Không xoá được – phiếu bị thay thế vẫn được lưu để truy xuất (§8.4)</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 && <div className="text-sm text-muted-foreground">Chưa có phiếu nào</div>}
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3 rounded-md border bg-card">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{r.code}</span>
                      <Badge variant={r.status === "Đã phát hành" ? "success" : r.status === "Đã thu hồi" ? "destructive" : "secondary"}>{r.status}</Badge>
                      {r.signature && <Badge variant="outline" className="text-emerald-700 border-emerald-300">Đã ký điện tử</Badge>}
                      {r.revision > 0 && <Badge variant="outline">Sửa đổi lần {r.revision}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Mẫu {r.sampleCode} · {r.snapshot.customer.name} · {r.snapshot.lines.length} chỉ tiêu · phát hành {dt(r.issuedAt)} bởi {r.issuedBy}
                      {r.replacesCode && ` · thay thế ${r.replacesCode}`}
                    </div>
                    {r.status === "Đã thu hồi" && (
                      <div className="text-xs text-rose-700">Thu hồi {dt(r.revokedAt)} bởi {r.revokedBy}: {r.revokeReason}</div>
                    )}
                  </div>
                  {r.status === "Đã phát hành" && canRevoke && (
                    <SignDialog
                      email={email}
                      meaning="Thu hồi phiếu kết quả"
                      title={`Thu hồi phiếu ${r.code}`}
                      description="Phiếu không bị xoá; trạng thái chuyển Đã thu hồi, hiển thị trên bản in và trang xác minh QR"
                      endpoint={`/api/test-reports/${r.id}/revoke`}
                      fields={[{ name: "reason", label: "Lý do thu hồi", required: true, multiline: true }]}
                      triggerLabel="Thu hồi"
                      variant="danger"
                    />
                  )}
                  <Link href={`/report-print/${r.id}`} className="h-8 px-3 inline-flex items-center rounded-md border text-xs font-medium hover:bg-accent shrink-0">
                    Xem / In
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
