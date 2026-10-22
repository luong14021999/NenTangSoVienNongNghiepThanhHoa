import Image from "next/image";
import { cn } from "@/lib/utils";

/** Tên cơ quan chủ quản và đơn vị – dùng thống nhất ở thanh trên, trang đăng nhập, cổng công khai, chân trang. */
export const GOV = {
  parent: "Ủy ban nhân dân tỉnh Thanh Hóa",
  unit: "Viện Nông nghiệp Thanh Hóa",
  platform: "Nền tảng số Viện Nông nghiệp Thanh Hóa",
  address: "271 Nguyễn Thục, phường Đông Quang, tỉnh Thanh Hóa",
  phone: "02373.952.119",
} as const;

/**
 * Khối nhận diện kiểu cơ quan nhà nước: logo trong viền vàng, dòng cơ quan chủ quản (chữ hoa nhỏ, vàng đồng),
 * tên đơn vị (chữ hoa, đậm, kiểu chữ có chân) và dòng phụ.
 */
export function GovIdentity({
  subtitle,
  tone = "onDark",
  size = "md",
  className,
}: {
  subtitle?: React.ReactNode;
  tone?: "onDark" | "onLight";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const logo = size === "lg" ? "w-20 h-20" : size === "md" ? "w-12 h-12 sm:w-14 sm:h-14" : "w-10 h-10";
  const unit = size === "lg" ? "text-xl sm:text-2xl" : size === "md" ? "text-base sm:text-xl" : "text-sm";
  const dark = tone === "onDark";
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-[hsl(var(--gov-gold))] shadow", logo)}>
        <Image src="/logo-vnnth.png" alt={GOV.unit} width={80} height={80} className={cn("object-contain", logo)} priority />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block truncate text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px]", dark ? "text-[hsl(var(--gov-gold-light))]" : "text-[hsl(var(--gov-red))]")}>{GOV.parent}</span>
        <span className={cn("gov-serif block truncate font-bold uppercase tracking-wide", unit, dark ? "text-white drop-shadow-sm" : "text-[hsl(var(--gov-red-dark))]")}>{GOV.unit}</span>
        {subtitle && <span className={cn("mt-0.5 block truncate text-xs", dark ? "text-white/80" : "text-muted-foreground")}>{subtitle}</span>}
      </span>
    </div>
  );
}

/** Dải viền vàng đồng dưới thanh tiêu đề. */
export function GovGoldRule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-1 w-full bg-gradient-to-r from-[hsl(var(--gov-gold))] via-[hsl(var(--gov-gold-light))] to-[hsl(var(--gov-gold))]", className)} />;
}

/** Chân trang kiểu cổng thông tin nhà nước: cơ quan chủ quản, đơn vị quản lý, địa chỉ, liên hệ. */
export function GovFooter({ className, email }: { className?: string; email?: string }) {
  return (
    <footer className={cn("border-t-4 border-[hsl(var(--gov-red))] bg-[hsl(var(--gov-red-dark))] text-white/85", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
        <div>
          <div>Cơ quan chủ quản: <span className="font-semibold text-white">{GOV.parent}</span></div>
          <div>Đơn vị quản lý, vận hành: <span className="font-semibold text-white">{GOV.unit}</span></div>
        </div>
        <div className="sm:text-right">
          <div>Địa chỉ: {GOV.address}</div>
          <div>Điện thoại: {GOV.phone}{email && <> · Email: {email}</>}</div>
        </div>
      </div>
    </footer>
  );
}
