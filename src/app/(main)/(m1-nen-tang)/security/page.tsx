import { Activity, KeyRound, ShieldAlert, ShieldCheck, Users, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatGrid } from "@/components/common/stat-grid";
import { MfaPanel } from "@/components/platform/mfa-panel";
import { ActionButton } from "@/components/platform/action-button";
import { currentAccess } from "@/lib/platform/data/access";
import { listAccounts, listAuthEvents, listSessions, securityCounters } from "@/lib/platform/data/security";
import { getSettings } from "@/lib/platform/data/settings";
import { SECURITY_HEADERS } from "@/lib/platform/security/headers";
import { fmtDateTimeVN as dtVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "An toàn thông tin" };

export default async function SecurityPage() {
  const [access, counters, accounts, sessions, events, settings] = await Promise.all([
    currentAccess(),
    securityCounters(),
    listAccounts(),
    listSessions(),
    listAuthEvents(),
    getSettings(),
  ]);
  const isAdmin = access.can("admin.users");
  const controls = [
    { name: "Đăng nhập bắt buộc cho toàn bộ ứng dụng và API", ok: true, note: "Proxy chặn mọi trang / API khi chưa đăng nhập (trừ trang xác minh phiếu, API v1 dùng khóa)" },
    { name: "Xác thực 2 lớp (TOTP)", ok: counters.mfaOn > 0, note: settings.mfa_required ? "Bắt buộc với mọi tài khoản" : `Tự nguyện – ${counters.mfaOn}/${counters.accounts} tài khoản đã bật` },
    { name: "Phân quyền theo vai trò, tách nhiệm vụ", ok: counters.rbacEnabled, note: counters.rbacEnabled ? "Đang bật" : "Chưa bật – mọi tài khoản đăng nhập có toàn quyền (trang Phân quyền)" },
    { name: "Nhật ký thay đổi dữ liệu (ai, khi nào, giá trị cũ → mới)", ok: true, note: `${counters.changes24h} thay đổi trong 24 giờ` },
    { name: "Chữ ký điện tử có xác thực lại + mã băm SHA-256", ok: true, note: "Phê duyệt kết quả, phát hành / thu hồi phiếu" },
    { name: "Khóa API chỉ lưu mã băm, có phạm vi và giới hạn tần suất", ok: true, note: `${counters.apiDenied24h} lượt gọi bị từ chối trong 24 giờ` },
    { name: "Chặn dò mã 2 lớp (khóa tạm sau 5 lần sai / 10 phút)", ok: true, note: `${counters.mfaFailed24h} lần sai trong 24 giờ` },
    { name: "Mã hóa đường truyền (HTTPS) + header bảo mật", ok: true, note: SECURITY_HEADERS.map((h) => h.key).join(", ") },
    { name: "Khóa bí mật 2 lớp mã hóa AES-256-GCM khi lưu", ok: Boolean(process.env.MFA_SECRET || process.env.NEON_AUTH_COOKIE_SECRET), note: process.env.MFA_SECRET ? "Khóa riêng MFA_SECRET" : "Dùng NEON_AUTH_COOKIE_SECRET – nên đặt MFA_SECRET riêng" },
  ];
  return (
    <>
      <Header title="An toàn thông tin & xác thực" description="M1.1 · M1.7 – xác thực 2 lớp, phiên đăng nhập, sự kiện xác thực, kiểm soát truy cập" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tài khoản", value: counters.accounts, icon: Users, accent: "bg-blue-50 text-blue-600", hint: `${counters.activeSessions} phiên đang hoạt động` },
            { label: "Bật 2 lớp", value: `${counters.mfaOn}/${counters.accounts}`, icon: ShieldCheck, accent: "bg-emerald-50 text-emerald-700", hint: settings.mfa_required ? "chính sách: bắt buộc" : "chính sách: tự nguyện" },
            { label: "Mã 2 lớp sai 24h", value: counters.mfaFailed24h, icon: ShieldAlert, accent: "bg-rose-50 text-rose-600" },
            { label: "API bị từ chối 24h", value: counters.apiDenied24h, icon: Activity, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><KeyRound className="w-4 h-4" /> Xác thực 2 lớp – tài khoản của tôi</CardTitle>
              <CardDescription>Đăng nhập cần thêm mã 6 chữ số từ ứng dụng trên điện thoại</CardDescription>
            </CardHeader>
            <CardContent><MfaPanel mode="manage" /></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biện pháp kiểm soát</CardTitle>
              <CardDescription>Đối chiếu yêu cầu bảo đảm an toàn hệ thống thông tin</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {controls.map((c) => (
                  <li key={c.name} className="flex gap-2">
                    {c.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />}
                    <div><div>{c.name}</div><div className="text-xs text-muted-foreground">{c.note}</div></div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader><CardTitle className="text-base">Tài khoản đăng nhập</CardTitle><CardDescription>Gắn với hồ sơ nhân sự qua email · Quản trị có thể đặt lại 2 lớp khi người dùng mất điện thoại</CardDescription></CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Nhân sự</TableHead><TableHead>Vai trò</TableHead><TableHead>2 lớp</TableHead><TableHead>Đăng nhập gần nhất</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{a.email}</TableCell>
                      <TableCell className="text-sm">{a.name || "—"}{!a.linkedStaff && <span className="block text-[11px] text-amber-600">chưa khớp email nhân sự</span>}</TableCell>
                      <TableCell className="text-xs">{a.roles || "—"}</TableCell>
                      <TableCell><Badge variant={a.mfa === "Đã bật" ? "success" : a.mfa === "Đang đăng ký" ? "warning" : "secondary"}>{a.mfa}</Badge>{a.mfa === "Đã bật" && <span className="block text-[11px] text-muted-foreground">{a.recoveryLeft} mã khôi phục</span>}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{dtVN(a.lastLogin)}{a.activeSessions ? ` · ${a.activeSessions} phiên` : ""}</TableCell>
                      <TableCell className="text-right">
                        {isAdmin && a.mfa !== "Chưa đăng ký" && (
                          <ActionButton url="/api/mfa/reset" body={{ email: a.email }} label="Đặt lại 2 lớp" icon={<RotateCcw />} confirm={`Gỡ xác thực 2 lớp của ${a.email}? Người dùng sẽ phải đăng ký lại.`} success="Đã đặt lại" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Lịch sử đăng nhập</CardTitle><CardDescription>Phiên gần nhất · địa chỉ IP · thiết bị</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {sessions.map((s) => (
                  <li key={s.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="font-medium">{s.email}</span>
                    <span className="text-xs text-muted-foreground">{dtVN(s.createdAt)}</span>
                    <span className="text-xs font-mono">{s.ip || "—"}</span>
                    <span className="text-xs text-muted-foreground">{s.device}</span>
                    {s.active && <Badge variant="success" className="ml-auto">đang hoạt động</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Sự kiện xác thực 2 lớp</CardTitle><CardDescription>Bật, gỡ, đặt lại, nhập đúng / sai, khóa tạm</CardDescription></CardHeader>
            <CardContent>
              {events.length === 0 && <div className="text-sm text-muted-foreground">Chưa có sự kiện</div>}
              <ul className="divide-y text-sm">
                {events.map((e) => (
                  <li key={e.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <Badge variant={e.event.includes("sai") || e.event.includes("khóa") ? "destructive" : e.event.includes("Gỡ") || e.event.includes("Đặt lại") ? "warning" : "secondary"}>{e.event}</Badge>
                    <span>{e.email}</span>
                    <span className="text-xs text-muted-foreground">{dtVN(e.at)} · {e.ip || "—"} · {e.device}</span>
                    {e.detail && <span className="text-xs text-muted-foreground">({e.detail})</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
