"use client";

import { usePathname } from "next/navigation";
import { SidebarNav, moduleOf, shellOf } from "@/components/layout/nav-config";

export function Sidebar() {
  const pathname = usePathname();
  // Trang chủ (chọn phần mềm) không có sidebar; trong mỗi phần mềm chỉ hiện menu của phần mềm đó.
  if (shellOf(moduleOf(pathname)) !== "sidebar") return null;

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <SidebarNav pathname={pathname} />
    </aside>
  );
}
