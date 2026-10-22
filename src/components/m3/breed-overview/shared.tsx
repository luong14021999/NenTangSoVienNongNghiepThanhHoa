import Link from "next/link";
import { ArrowRight, Fence, Sprout, Waves, Wheat } from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

/** Biểu tượng theo nhóm giống (BREED_KINDS). */
export const KIND_ICON: Record<string, LucideIcon> = {
  "Cây trồng": Wheat,
  "Vật nuôi": Fence,
  "Thủy sản": Waves,
};

/** Biểu tượng nhóm giống – component tĩnh, chọn icon theo `kind`. */
export function KindIcon({ kind, ...props }: { kind: string } & LucideProps) {
  const Icon = KIND_ICON[kind] ?? Sprout;
  return <Icon aria-hidden {...props} />;
}

/** Nền "luống ruộng": sọc chéo theo màu phân hệ – thay cho ảnh khi giống chưa có ảnh. */
export const furrowStyle: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, hsl(var(--primary) / 0.10) 0 6px, transparent 6px 16px), linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)",
};

/** Dải chuyển màu thương hiệu của phân hệ (cùng nguồn với thanh trên cùng). */
export const brandStyle: CSSProperties = {
  backgroundImage: "linear-gradient(120deg, hsl(var(--brand-from)) 0%, hsl(var(--brand-via)) 55%, hsl(var(--brand-to)) 100%)",
};

const nf = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
export const fmtNum = (n: number) => nf.format(n);

/** Gộp số lượng theo đơn vị (không cộng lẫn kg với cây/con). */
export function qtyByUnit(rows: { quantity: number; unit: string }[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!Number.isFinite(r.quantity) || r.quantity <= 0) continue;
    const u = r.unit || "đv";
    m.set(u, (m.get(u) ?? 0) + r.quantity);
  }
  return [...m].sort((a, b) => b[1] - a[1]).map(([u, q]) => `${fmtNum(q)} ${u}`).join(" · ");
}

export function SectionHeading({ id, icon: Icon, title, description, href, linkLabel = "Xem tất cả" }: { id: string; icon: LucideIcon; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="mt-0.5 grid place-items-center w-8 h-8 shrink-0 rounded-lg bg-primary/10 text-primary" aria-hidden>
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold leading-tight">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {linkLabel} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Khung "thửa ruộng" cho từng khối – nền thẻ, viền đất. */
export function Plot({ labelledBy, className = "", children }: { labelledBy: string; className?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={labelledBy} className={`rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-6 text-center text-xs text-muted-foreground">{children}</p>;
}
