"use client";

import Link from "next/link";
import { navModules } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

export type LauncherStat = { text: string; tone?: "ok" | "warn" | "down" | "muted" };

const toneCls = { ok: "text-emerald-700 dark:text-emerald-400", warn: "text-amber-700 dark:text-amber-400", down: "text-rose-600 font-semibold", muted: "text-muted-foreground" };

/** Lưới chức năng quản trị (M1) theo nhóm – mỗi ô kèm một dòng trạng thái do trang tính sẵn. */
export function AdminLauncher({ stats }: { stats: Record<string, LauncherStat> }) {
  const m1 = navModules.find((m) => m.key === "m1");
  if (!m1) return null;
  const groups = m1.groups.map((g) => ({ ...g, items: g.items.filter((i) => i.href !== m1.home) })).filter((g) => g.items.length);
  return (
    <section aria-labelledby="admin-launcher" className="space-y-3">
      <h2 id="admin-launcher" className="text-sm font-semibold">Chức năng quản trị</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <div key={g.label} className="rounded-xl border bg-card p-3">
            <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h3>
            <ul className="space-y-1">
              {g.items.map((i) => {
                const Icon = i.icon;
                const st = stats[i.href];
                return (
                  <li key={i.href}>
                    <Link href={i.href} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 leading-tight">
                        <span className="block text-sm font-medium">{i.label}</span>
                        {st && <span className={cn("block truncate text-[11px]", toneCls[st.tone ?? "muted"])}>{st.text}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
