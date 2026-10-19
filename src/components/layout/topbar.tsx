"use client";

import Link from "next/link";
import Image from "next/image";
import { HeaderUser } from "@/components/layout/header-user";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

export function TopBar() {
  return (
    <header
      className="relative h-16 sm:h-20 shrink-0 text-white pl-2 pr-2 sm:pr-5 lg:pl-5 lg:pr-7 flex items-center gap-2 sm:gap-3 lg:gap-4 shadow-md"
      style={{
        background:
          "linear-gradient(120deg, hsl(145 62% 30%) 0%, hsl(150 55% 23%) 55%, hsl(155 60% 16%) 100%)",
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
      <div className="relative z-10 md:hidden">
        <MobileSidebar />
      </div>

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
        <div className="leading-tight min-w-0">
          <div className="text-base sm:text-xl font-bold tracking-tight text-white drop-shadow-sm truncate">
            Phòng phân tích Đất, nước, phân bón và môi trường
          </div>
          <div className="hidden sm:block text-xs lg:text-[13px] text-white/70 font-medium mt-0.5 truncate">
            Viện Nông nghiệp tỉnh Thanh Hóa · Mã VILAS 1501
          </div>
        </div>
      </Link>

      {/* Logout */}
      <div className="relative z-10 ml-auto shrink-0">
        <HeaderUser />
      </div>
    </header>
  );
}
