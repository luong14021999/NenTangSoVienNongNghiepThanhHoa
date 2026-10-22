import { PermissionGate } from "@/components/platform/permission-gate";

/** Danh mục dùng chung (M1.2): quản trị và đầu mối danh mục của các phòng. */
export default function CatalogAreaLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate any={["write.mdm", "admin.view"]} area="Danh mục dùng chung">{children}</PermissionGate>;
}
