import { PermissionGate } from "@/components/platform/permission-gate";

/** Khu Quản trị hệ thống (M1): chỉ vai trò Quản trị. */
export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate any={["admin.view"]} area="khu Quản trị hệ thống">{children}</PermissionGate>;
}
