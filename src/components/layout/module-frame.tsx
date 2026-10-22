"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TabShellNav } from "@/components/layout/shells/tab-shell-nav";
import { AreasNav } from "@/components/layout/shells/areas-nav";
import { moduleOf, shellOf } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

/** Khung điều hướng theo từng phần mềm: menu dọc (phòng thí nghiệm), bàn làm việc dạng tab (nuôi cấy mô) tab theo khu nghiệp vụ (giống) hoặc khu làm việc theo nhóm người dùng (dịch vụ – KH&CN). */
export function ModuleFrame({ children }: { children: React.ReactNode }) {
  const shell = shellOf(moduleOf(usePathname()));
  if (shell === "areas") {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <AreasNav />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">{children}</div>
      </div>
    );
  }
  if (shell === "bench" || shell === "hub") {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <TabShellNav variant={shell} />
        <div className={cn("flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden", shell === "bench" && "pb-16 md:pb-0")}>{children}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}
