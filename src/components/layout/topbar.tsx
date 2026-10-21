"use client";

import Link from "next/link";
import Image from "next/image";
import { HeaderUser } from "@/components/layout/header-user";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { usePathname } from "next/navigation";
import { moduleOf } from "@/components/layout/nav-config";

export function TopBar() {
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  const hasSidebar = !!mod;
  const ModIcon = mod?.icon;
  return (
    <header
      className="relative h-16 sm:h-20 shrink-0 text-white pl-2 pr-2 sm:pr-5 lg:pl-5 lg:pr-7 flex items-center gap-2 sm:gap-3 lg:gap-4 shadow-md"
      style={{
        background:
          "linear-gradient(120deg, hsl(var(--brand-from)) 0%, hsl(var(--brand-via)) 55%, hsl(var(--brand-to)) 100%)",
      }}
    >
      {/* subtle decorative overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% -20%, white 0%, transparent 40%)",
        }}
      />

      {/* Mobile nav trigger */}
      {hasSidebar && (
        <div className="relative z-10 md:hidden">
          <MobileSidebar />
        </div>
      )}

      {/* Brand */}
      <Link
        href="/"
        className="relative z-10 flex items-center gap-2.5 sm:gap-3.5 min-w-0 group"
      >
        <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-white ring-2 ring-white/50 shadow-lg flex items-center justify-center overflow-hidden shrink-0 transition-transform sm:group-hover:scale-105">
          <Image
            src="/logo-vnnth.png"
            alt="Viện Nông nghiệp tỉnh Thanh Hóa"
            width={64}
            height={64}
            className="w-11 h-11 sm:w-16 sm:h-16 object-contain"
            priority
          />
        </div>
        {mod && ModIcon ? (
          <>
            <div className="hidden sm:flex w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/30 items-center justify-center shrink-0">
              <ModIcon className="w-6 h-6 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/65 truncate">
                <span className="font-mono rounded bg-white/15 px-1.5 py-px text-white">{mod.code}</span>
                <span className="truncate">Viện Nông nghiệp tỉnh Thanh Hóa</span>
              </div>
              <div className="text-base sm:text-xl font-bold tracking-tight text-white drop-shadow-sm truncate sm:mt-0.5">
                {mod.name}
              </div>
              <div className="hidden md:block text-xs text-white/70 font-medium mt-0.5 truncate">{mod.tagline}</div>
            </div>
          </>
        ) : (
          <div className="leading-tight min-w-0">
            <div className="text-base sm:text-xl font-bold tracking-tight text-white drop-shadow-sm truncate">
              Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa
            </div>
            <div className="hidden sm:block text-xs lg:text-[13px] text-white/70 font-medium mt-0.5 truncate">
              Một tài khoản cho tất cả phân hệ
            </div>
          </div>
        )}
      </Link>

      {/* Logout */}
      <div className="relative z-10 ml-auto shrink-0">
        <HeaderUser />
      </div>
    </header>
  );
}
