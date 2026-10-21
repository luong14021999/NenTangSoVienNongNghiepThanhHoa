import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Pulse = { code: string; name: string; value: string | number; label: string; href: string };

/** Hàng "nhịp phân hệ": mỗi chip là một chỉ số sống của phân hệ nghiệp vụ dùng nền tảng M1. */
export function ModulePulse({ items }: { items: Pulse[] }) {
  return (
    <nav aria-label="Nhịp các phân hệ" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin snap-x">
      {items.map((p) => (
        <Link
          key={p.code + p.label}
          href={p.href}
          title={p.name}
          className="group snap-start shrink-0 flex items-center gap-2 rounded-full border bg-card/95 pl-1 pr-2.5 py-1 text-xs shadow-sm transition-colors hover:border-primary/60 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-mono text-[10px] font-bold rounded-full bg-primary/10 text-primary px-2 py-0.5">{p.code}</span>
          <span className="font-mono font-semibold tabular-nums">{p.value}</span>
          <span className="text-muted-foreground whitespace-nowrap">{p.label}</span>
          <ChevronRight aria-hidden className="size-3 text-muted-foreground group-hover:text-primary" />
        </Link>
      ))}
    </nav>
  );
}
