import { PermissionGate } from "@/components/platform/permission-gate";

/** Khu Điều hành (M1.4–M1.6): Ban lãnh đạo Viện, trưởng phòng, quản trị. */
export default function ExecutiveAreaLayout({ children }: { children: React.ReactNode }) {
  return <PermissionGate any={["view.executive"]} area="khu Điều hành">{children}</PermissionGate>;
}
