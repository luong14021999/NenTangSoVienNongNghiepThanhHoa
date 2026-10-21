import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DossierTab = { key: string; label: string; icon: LucideIcon; count?: number; alert?: boolean };

/** Hàng tab của hồ sơ giống (theo ?tab=), giữ nguyên địa chỉ hồ sơ. */
export function DossierTabs({ base, tabs, active }: { base: string; tabs: DossierTab[]; active: string }) {
  return (
    <nav aria-label="Hồ sơ giống" className="-mx-4 overflow-x-auto border-b px-4 scrollbar-thin sm:-mx-6 sm:px-6">
      <ul className="flex gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = t.key === active;
          return (
            <li key={t.key}>
              <Link
                href={t.key === tabs[0].key ? base : `${base}?tab=${t.key}`}
                aria-current={on ? "page" : undefined}
                className={cn("flex h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-medium", on ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {t.count != null && <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", t.alert ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground")}>{t.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Khối nội dung trong hồ sơ: tiêu đề, mô tả ngắn, nút thao tác bên phải. */
export function DossierSection({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card", className)}>
      <header className="flex flex-wrap items-start gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Bảng gọn trong hồ sơ (không phân trang). */
export function MiniTable({ headers, rows, empty = "Chưa có" }: { headers: string[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] text-muted-foreground">
          <tr>{headers.map((h) => <th key={h} className="px-4 pb-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="px-4 py-2 align-top">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
