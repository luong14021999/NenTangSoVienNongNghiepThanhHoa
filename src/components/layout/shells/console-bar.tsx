"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Gauge, LayoutGrid } from "lucide-react";
import { isActiveHref, moduleOf } from "@/components/layout/nav-config";
import { CatalogSheet } from "@/components/layout/shells/tab-shell-nav";

/**
 * Khung "bảng điều khiển" (M1 – quản trị): không có menu dọc. Bảng điều hành là trang trung tâm,
 * mỗi trang quản trị có đường dẫn quay về và nút mở toàn bộ chức năng quản trị.
 */
export function ConsoleBar() {
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  const [open, setOpen] = useState(false);
  if (!mod) return null;
  const atHome = isActiveHref(mod.home, pathname);
  const group = mod.groups.find((g) => g.items.some((i) => isActiveHref(i.href, pathname)));
  const item = group?.items.find((i) => isActiveHref(i.href, pathname));
  const groups = mod.groups.map((g) => ({ ...g, items: g.items.filter((i) => i.href !== mod.home) })).filter((g) => g.items.length);

  return (
    <nav aria-label="Đường dẫn quản trị" className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3 lg:px-5">
      <Link href={mod.home} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium ${atHome ? "text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
        <Gauge className="h-4 w-4" />Bảng điều hành
      </Link>
      {!atHome && item && (
        <>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="hidden text-xs text-muted-foreground sm:inline">{group?.label}</span>
          <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:inline" aria-hidden />
          <span className="truncate text-sm font-semibold" aria-current="page">{item.label}</span>
        </>
      )}
      <div className="ml-auto">
        <CatalogSheet
          title="Chức năng quản trị"
          groups={groups}
          pathname={pathname}
          open={open}
          onOpenChange={setOpen}
          trigger={
            <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-accent">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Tất cả chức năng</span>
            </button>
          }
        />
      </div>
    </nav>
  );
}
