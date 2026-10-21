import { KeyRound, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
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
import { RoleEditor } from "@/components/access/role-editor";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { currentAccess, listUserRoles } from "@/lib/data/access";
import { staffStore } from "@/lib/data/staff";
import { PERMISSIONS, ROLES, type Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phân quyền" };

const dt = (iso: string) => (iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }) : "");

export default async function AccessControlPage() {
  const [access, users, staff] = await Promise.all([currentAccess(), listUserRoles(), staffStore.list()]);
  const isAdmin = access.can("admin.users");
  const suggestions = staff.filter((s) => s.email).map((s) => ({ email: s.email.toLowerCase(), name: s.fullName }));
  const staffByEmail = new Map(suggestions.map((s) => [s.email, s.name]));

  return (
    <>
      <Header
        title="Phân quyền theo vai trò"
        description="ISO/IEC 17025:2017 §7.11.3 – chỉ người được phân quyền mới thao tác được; tách nhiệm vụ nhập / duyệt / phê duyệt / phát hành"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            {
              label: "Phân quyền",
              value: access.enabled ? "Đang bật" : "Chưa bật",
              icon: access.enabled ? ShieldCheck : ShieldOff,
              accent: access.enabled ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
              hint: access.enabled ? "kiểm soát ở mọi API ghi dữ liệu" : "mọi tài khoản đang có toàn quyền",
            },
            { label: "Tài khoản được phân quyền", value: users.filter((u) => u.active).length, icon: UserCog, accent: "bg-blue-50 text-blue-600" },
            { label: "Quản trị", value: users.filter((u) => u.active && u.roles.includes("Quản trị")).length, icon: KeyRound, accent: "bg-violet-50 text-violet-600" },
            { label: "Vai trò của bạn", value: access.enabled ? access.roles.join(", ") || "—" : "Toàn quyền", icon: ShieldCheck, accent: "bg-amber-50 text-amber-600", hint: access.actor?.email },
          ]}
        />

        {!access.enabled && access.actor && (
          <Card className="border-amber-300">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 text-sm">
                <div className="font-semibold">Chưa bật phân quyền</div>
                <div className="text-muted-foreground">
                  Hiện mọi tài khoản đăng nhập đều có toàn quyền. Bật phân quyền bằng cách gán vai trò <b>Quản trị</b> cho chính bạn ({access.actor.email}),
                  sau đó gán vai trò cho từng người.
                </div>
              </div>
              <RoleEditor bootstrapEmail={access.actor.email} suggestions={suggestions} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
            <div>
              <CardTitle>Tài khoản & vai trò</CardTitle>
              <CardDescription>
                Gắn theo email đăng nhập. Email trùng email trong Nhân sự để ủy quyền phép thử và lưu vết dùng đúng họ tên.
              </CardDescription>
            </div>
            {access.enabled && isAdmin && <RoleEditor suggestions={suggestions} />}
          </CardHeader>
          <CardContent>
            {users.length === 0 && <div className="text-sm text-muted-foreground py-4 text-center">Chưa có tài khoản nào được phân quyền</div>}
            <div className="rounded-lg border divide-y">
              {users.map((u) => (
                <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-2 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{u.fullName || staffByEmail.get(u.email) || u.email}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {u.email}
                      {!staffByEmail.has(u.email) && <span className="font-sans text-amber-700"> · chưa có trong Nhân sự</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length ? u.roles.map((r) => <Badge key={r} variant={r === "Quản trị" ? "default" : "outline"}>{r}</Badge>) : <span className="text-xs text-muted-foreground">không có vai trò</span>}
                    {!u.active && <Badge variant="secondary">Ngừng hoạt động</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground md:w-44">{u.updatedBy} · {dt(u.updatedAt)}</div>
                  {isAdmin && (
                    <div className="flex gap-1.5">
                      <RoleEditor initial={{ email: u.email, fullName: u.fullName, roles: u.roles, active: u.active, note: u.note }} suggestions={suggestions} />
                      <DeleteEntityButton entity="user-roles" id={u.id} label={u.email} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ma trận quyền</CardTitle>
            <CardDescription>Áp dụng ở server cho mọi thao tác ghi; mọi tài khoản đăng nhập đều được xem dữ liệu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 min-w-[260px]">Quyền</th>
                    {ROLES.map((r) => <th key={r} className="font-medium px-2 py-2 text-center">{r}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(Object.keys(PERMISSIONS) as Permission[]).map((p) => (
                    <tr key={p}>
                      <td className="px-3 py-1.5">{PERMISSIONS[p].label}</td>
                      {ROLES.map((r) => (
                        <td key={r} className="px-2 py-1.5 text-center">
                          {(PERMISSIONS[p].roles as readonly string[]).includes(r) ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-muted-foreground/40">–</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
