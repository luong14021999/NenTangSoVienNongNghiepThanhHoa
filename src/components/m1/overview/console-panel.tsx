import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Khung bảng điều khiển gọn: tiêu đề kiểu "kênh giám sát", nhãn mã, liên kết chi tiết. */
export function ConsolePanel({
  title,
  code,
  icon: Icon,
  href,
  hrefLabel = "Chi tiết",
  aside,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  code?: string;
  icon?: LucideIcon;
  href?: string;
  hrefLabel?: string;
  aside?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const id = `panel-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={id} className={cn("rounded-lg border bg-card/95 text-card-foreground shadow-sm backdrop-blur-sm flex flex-col min-w-0", className)}>
      <header className="flex items-center gap-2 border-b px-3 py-2">
        {Icon && <Icon aria-hidden className="size-4 text-primary shrink-0" />}
        <h2 id={id} className="text-sm font-semibold truncate">{title}</h2>
        {code && <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border rounded px-1 py-px shrink-0">{code}</span>}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {aside}
          {href && (
            <Link href={href} className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              {hrefLabel}
              <ArrowUpRight aria-hidden className="size-3" />
              <span className="sr-only">: {title}</span>
            </Link>
          )}
        </div>
      </header>
      <div className={cn("p-3 flex-1 min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Ô số liệu đọc nhanh, số dạng monospace. */
export function Readout({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground truncate">{label}</div>
      <div className={cn("font-mono text-lg font-semibold tabular-nums leading-tight", tone)}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground truncate">{hint}</div>}
    </div>
  );
}
