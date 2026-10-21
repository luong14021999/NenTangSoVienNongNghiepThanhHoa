import { headers } from "next/headers";
import { Ban, CheckCircle2, KeyRound, Network, RefreshCw, Trash2, Waypoints, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatGrid } from "@/components/qms/stat-grid";
import { ActionButton } from "@/components/platform/action-button";
import { ApiKeyDialog } from "@/components/platform/api-key-dialog";
import { LgspSendForm } from "@/components/platform/lgsp-send-form";
import { currentAccess } from "@/lib/data/access";
import { apiCallStats, listApiCalls, listApiClients, listMessages } from "@/lib/data/integration";
import { listCatalogs } from "@/lib/data/mdm";
import { listReports } from "@/lib/data/reports";
import { getSetting } from "@/lib/data/settings";
import { API_SCOPES } from "@/lib/integration/api-keys";
import { CHANNELS, OUTBOUND_SERVICES, channelMode } from "@/lib/integration/lgsp";
import { endpoints } from "@/lib/integration/openapi";
import { fmtDateTimeVN } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tích hợp & API" };

export default async function IntegrationPage() {
  const [access, clients, calls, messages, reports, catalogs, defaultRate, callStats] = await Promise.all([
    currentAccess(),
    listApiClients(),
    listApiCalls(60),
    listMessages(60),
    listReports(),
    listCatalogs(),
    getSetting("api_default_rate_limit"),
    apiCallStats(),
  ]);
  const admin = access.can("admin.system");
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <>
      <Header title="Tích hợp, chia sẻ dữ liệu & API" description="M1.3 – API v1 cho hệ thống bên ngoài (khóa API, phạm vi, giới hạn tần suất) và kết nối LGSP tỉnh / NDXP quốc gia" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Khóa API hoạt động", value: clients.filter((c) => c.active).length, icon: KeyRound, accent: "bg-blue-50 text-blue-600", hint: `${clients.length} khóa đã cấp` },
            { label: "Lượt gọi API 24h", value: callStats.total, icon: Waypoints, accent: "bg-violet-50 text-violet-600", hint: `${callStats.denied} bị từ chối / lỗi` },
            { label: "Thông điệp LGSP/NDXP", value: messages.length, icon: Network, accent: "bg-emerald-50 text-emerald-700", hint: `${messages.filter((m) => m.status === "Lỗi").length} lỗi` },
            { label: "Chế độ kết nối", value: CHANNELS.every((c) => channelMode(c) === "Thật") ? "Thật" : "Mô phỏng", icon: AlertTriangle, accent: "bg-amber-50 text-amber-600", hint: CHANNELS.map((c) => `${c}: ${channelMode(c)}`).join(" · ") },
          ]}
        />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => (
            <Card key={ch}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">{ch} <Badge variant={channelMode(ch) === "Thật" ? "success" : "warning"}>{channelMode(ch)}</Badge></CardTitle>
                <CardDescription>{ch === "LGSP" ? "Nền tảng tích hợp, chia sẻ dữ liệu cấp tỉnh" : "Nền tảng tích hợp, chia sẻ dữ liệu quốc gia"}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                {channelMode(ch) === "Mô phỏng" ? (
                  <>
                    <div>Chưa có tài khoản kết nối: thông điệp được tạo đúng định dạng, ghi nhật ký và nhận biên nhận giả lập – <b>không gửi ra ngoài</b>.</div>
                    <div>Khi được cấp tài khoản: đặt biến môi trường <span className="font-mono">{ch}_BASE_URL</span>, <span className="font-mono">{ch}_TOKEN</span>, <span className="font-mono">{ch}_AGENCY_CODE</span> trên Vercel – không phải sửa mã.</div>
                  </>
                ) : (
                  <div>Đang gửi tới <span className="font-mono">{process.env[`${ch}_BASE_URL`]}</span></div>
                )}
                <div>Chiều nhận: {ch} gọi <span className="font-mono">POST {origin}/api/v1/lgsp/inbound</span> bằng khóa API có phạm vi <span className="font-mono">lgsp:inbound</span>.</div>
              </CardContent>
            </Card>
          ))}
        </section>

        {admin && (
          <Card>
            <CardHeader><CardTitle className="text-base">Gửi dữ liệu lên nền tảng</CardTitle><CardDescription>Chỉ dữ liệu được phép chia sẻ, không có dữ liệu cá nhân · ghi nhật ký mọi lần gửi</CardDescription></CardHeader>
            <CardContent>
              <LgspSendForm services={OUTBOUND_SERVICES} refs={{ reports: reports.filter((r) => r.status === "Đã phát hành").map((r) => r.code), catalogs: catalogs.map((c) => c.code) }} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Nhật ký thông điệp</CardTitle><CardDescription>Gửi đi / nhận về · thông điệp lỗi có thể gửi lại</CardDescription></CardHeader>
          <CardContent>
            {messages.length === 0 && <div className="text-sm text-muted-foreground">Chưa có thông điệp</div>}
            <ul className="divide-y">
              {messages.map((m) => (
                <li key={m.id} className="py-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.status === "Thành công" ? "success" : "destructive"}>{m.status}</Badge>
                    <Badge variant="outline">{m.direction} · {m.channel}</Badge>
                    <span className="font-medium">{OUTBOUND_SERVICES[m.service as keyof typeof OUTBOUND_SERVICES] ?? m.service}</span>
                    <span className="text-xs text-muted-foreground">{fmtDateTimeVN(m.at)} · {m.actor} · {m.mode}{m.attempts > 1 ? ` · lần ${m.attempts}` : ""}</span>
                    {admin && m.status === "Lỗi" && m.direction === "Gửi đi" && <span className="ml-auto"><ActionButton url={`/api/integration/${m.id}`} label="Gửi lại" icon={<RefreshCw />} success="Đã gửi lại" /></span>}
                  </div>
                  <details className="mt-1">
                    <summary className="text-xs text-muted-foreground cursor-pointer">Mã giao dịch <span className="font-mono">{m.correlationId}</span>{m.error && <span className="text-rose-600"> · {m.error}</span>}</summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                      <pre className="text-[11px] bg-muted/50 rounded p-2 overflow-auto max-h-56">{JSON.stringify(m.payload, null, 2)}</pre>
                      <pre className="text-[11px] bg-muted/50 rounded p-2 overflow-auto max-h-56">{JSON.stringify(m.response, null, 2)}</pre>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div><CardTitle className="text-base">Khóa API</CardTitle><CardDescription>Mỗi hệ thống bên ngoài một khóa riêng, chỉ cấp phạm vi cần thiết</CardDescription></div>
            {admin && <ApiKeyDialog scopes={API_SCOPES} defaultRate={defaultRate} />}
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Hệ thống</TableHead><TableHead>Khóa</TableHead><TableHead>Phạm vi</TableHead><TableHead>Giới hạn</TableHead><TableHead>Dùng gần nhất</TableHead><TableHead>Trạng thái</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {clients.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Chưa cấp khóa nào</TableCell></TableRow>}
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{c.name}<div className="text-[11px] text-muted-foreground">{c.organization}</div></TableCell>
                      <TableCell className="font-mono text-xs">{c.keyPrefix}…</TableCell>
                      <TableCell className="text-[11px] font-mono max-w-[220px]">{c.scopes.join(", ")}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{c.rateLimit ? `${c.rateLimit}/phút` : "không"}{c.expiresAt && <div className="text-muted-foreground">hết hạn {c.expiresAt}</div>}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{fmtDateTimeVN(c.lastUsedAt)}<div className="text-muted-foreground">{c.calls24h} lượt / 24h</div></TableCell>
                      <TableCell><Badge variant={c.active ? "success" : "secondary"}>{c.active ? "Hoạt động" : "Vô hiệu"}</Badge></TableCell>
                      <TableCell>
                        {admin && (
                          <div className="flex justify-end gap-1.5">
                            <ActionButton url={`/api/api-clients/${c.id}`} method="PATCH" body={{ active: !c.active }} label={c.active ? "Vô hiệu" : "Kích hoạt"} icon={c.active ? <Ban /> : <CheckCircle2 />} success="Đã cập nhật" />
                            <ActionButton url={`/api/api-clients/${c.id}`} method="DELETE" label="Thu hồi" icon={<Trash2 />} variant="ghost" confirm={`Thu hồi vĩnh viễn khóa của ${c.name}?`} success="Đã thu hồi" />
                          </div>
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
            <CardHeader>
              <CardTitle className="text-base">Tài liệu API v1</CardTitle>
              <CardDescription>
                Đặc tả OpenAPI: <a className="text-primary hover:underline font-mono" href="/api/v1/openapi.json" target="_blank">/api/v1/openapi.json</a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="divide-y text-sm">
                {endpoints().map((e) => (
                  <li key={e.method + e.path} className="py-1.5 flex flex-wrap items-baseline gap-x-2">
                    <Badge variant={e.method === "GET" ? "secondary" : "warning"} className="font-mono text-[10px]">{e.method}</Badge>
                    <span className="font-mono text-xs">/api/v1{e.path}</span>
                    <span className="text-xs text-muted-foreground">{e.summary}</span>
                    {e.scope && <span className="ml-auto font-mono text-[10px] text-muted-foreground">{e.scope}</span>}
                  </li>
                ))}
              </ul>
              <pre className="text-[11px] bg-muted/50 rounded p-2 overflow-auto">{`curl -H "X-API-Key: vnn_…" ${origin}/api/v1/tests`}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Nhật ký gọi API</CardTitle><CardDescription>Gồm cả lượt bị từ chối (sai khóa, thiếu phạm vi, vượt giới hạn)</CardDescription></CardHeader>
            <CardContent>
              {calls.length === 0 && <div className="text-sm text-muted-foreground">Chưa có lượt gọi</div>}
              <ul className="divide-y text-xs">
                {calls.map((c) => (
                  <li key={c.id} className="py-1.5 flex flex-wrap items-center gap-x-2">
                    <Badge variant={c.status < 400 ? "success" : c.status === 429 ? "warning" : "destructive"} className="font-mono text-[10px]">{c.status}</Badge>
                    <span className="font-mono">{c.method} {c.path}</span>
                    <span className="text-muted-foreground">{c.clientName} · {c.ms} ms · {fmtDateTimeVN(c.at)}</span>
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
