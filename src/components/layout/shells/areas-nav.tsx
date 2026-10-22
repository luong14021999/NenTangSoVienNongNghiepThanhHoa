"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveHref, moduleOf, tabsOf } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

/**
 * Khung "khu làm việc" (M4): phần mềm phục vụ nhiều nhóm người dùng khác nhau
 * (bộ phận dịch vụ, quản lý khoa học, quản lý tri thức) – chọn khu trước, rồi đến các trang của khu.
 */
export function AreasNav() {
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  if (!mod) return null;
  const areas = tabsOf(mod);
  const active = areas.find((a) => a.items.some((i) => isActiveHref(i.href, pathname)));

  return (
    <nav aria-label={mod.name} className="shrink-0 border-b bg-card">
      <ul className="flex gap-2 overflow-x-auto px-3 pt-3 scrollbar-thin lg:px-5">
        {areas.map((a) => {
          const Icon = a.icon;
          const on = a === active;
          return (
            <li key={a.label} className="shrink-0">
              <Link
                href={a.items[0]?.href ?? mod.home}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors",
                  on ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-background hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", on ? "bg-white/20" : "bg-primary/10 text-primary")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">{a.label}</span>
                  {a.description && <span className={cn("hidden text-[11px] lg:block", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{a.description}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {active && active.items.length > 1 ? (
        <ul className="mt-2 flex gap-1 overflow-x-auto px-3 scrollbar-thin lg:px-5">
          {active.items.map((i) => {
            const Icon = i.icon;
            const on = isActiveHref(i.href, pathname);
            return (
              <li key={i.href} className="shrink-0">
                <Link href={i.href} aria-current={on ? "page" : undefined} className={cn("flex h-10 items-center gap-1.5 border-b-2 px-2.5 text-sm", on ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  <Icon className="h-4 w-4" />
                  {i.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="h-3" />
      )}
    </nav>
  );
}
