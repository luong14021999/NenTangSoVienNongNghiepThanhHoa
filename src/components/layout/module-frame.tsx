"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BenchNav } from "@/components/layout/shells/bench-nav";
import { moduleOf, shellOf } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

/** Khung điều hướng theo từng phần mềm: menu dọc (phòng thí nghiệm) hoặc bàn làm việc dạng tab (nuôi cấy mô). */
export function ModuleFrame({ children }: { children: React.ReactNode }) {
  const shell = shellOf(moduleOf(usePathname()));
  if (shell === "bench") {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <BenchNav />
        <div className={cn("flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-0")}>{children}</div>
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
