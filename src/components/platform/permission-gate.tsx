import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { currentAccess } from "@/lib/platform/data/access";
import { PERMISSIONS, type Permission } from "@/lib/platform/permissions";

/**
 * Chặn cả khu trang theo quyền (đặt trong layout của nhóm route): không chỉ ẩn nút ở trang chủ.
 * Chưa bật phân quyền (bảng vai trò trống) thì mọi tài khoản đều vào được – để quản trị viên khởi tạo.
 */
export async function PermissionGate({ any, area, children }: { any: Permission[]; area: string; children: React.ReactNode }) {
  const { actor, roles, can } = await currentAccess();
  if (any.some((p) => can(p))) return <>{children}</>;
  const who = PERMISSIONS[any[0]].roles.join(", ");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-3 text-lg font-semibold">Không có quyền vào {area}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tài khoản {actor?.name ?? actor?.email ?? ""} ({roles.length ? roles.join(", ") : "chưa được giao vai trò"}) không có quyền này. Khu này dành cho vai trò: {who}.
          Cần truy cập, xin liên hệ quản trị hệ thống.
        </p>
        <Link href="/" className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Về trang chủ</Link>
      </div>
    </main>
  );
}
