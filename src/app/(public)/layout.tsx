import Link from "next/link";
import Image from "next/image";
import { labInfo } from "@/lib/modules/m2/accreditation";

/** Giao diện cổng công khai (M4): không có menu nội bộ, không cần đăng nhập. */
export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      <header
        className="text-white shadow-md"
        style={{ background: "linear-gradient(120deg, hsl(145 62% 30%) 0%, hsl(150 55% 23%) 55%, hsl(155 60% 16%) 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center gap-3">
          <Link href="/portal" className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white ring-2 ring-white/50 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/logo-vnnth.png" alt="Viện Nông nghiệp tỉnh Thanh Hóa" width={56} height={56} className="w-11 h-11 sm:w-14 sm:h-14 object-contain" priority />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-bold text-sm sm:text-lg truncate">Viện Nông nghiệp tỉnh Thanh Hóa</div>
              <div className="text-[11px] sm:text-xs text-white/75 truncate">Cổng dịch vụ & tra cứu khoa học và công nghệ</div>
            </div>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-1 text-sm">
            <Link href="/portal" className="px-3 py-2 rounded-md hover:bg-white/10">Trang chủ</Link>
            <Link href="/portal/request" className="px-3 py-2 rounded-md hover:bg-white/10">Gửi yêu cầu</Link>
            <Link href="/portal/status" className="px-3 py-2 rounded-md hover:bg-white/10">Tra cứu yêu cầu</Link>
            <Link href="/trace" className="px-3 py-2 rounded-md hover:bg-white/10">Truy xuất lô giống</Link>
            <Link href="/portal/knowledge" className="px-3 py-2 rounded-md hover:bg-white/10">Tra cứu tri thức</Link>
            <Link href="/portal/giong" className="px-3 py-2 rounded-md hover:bg-white/10">Giống</Link>
          </nav>
        </div>
        <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-2 text-xs">
          <Link href="/portal" className="px-2.5 py-1.5 rounded-md bg-white/10 whitespace-nowrap">Trang chủ</Link>
          <Link href="/portal/request" className="px-2.5 py-1.5 rounded-md bg-white/10 whitespace-nowrap">Gửi yêu cầu</Link>
          <Link href="/portal/status" className="px-2.5 py-1.5 rounded-md bg-white/10 whitespace-nowrap">Tra cứu</Link>
          <Link href="/trace" className="px-2.5 py-1.5 rounded-md bg-white/10 whitespace-nowrap">Truy xuất</Link>
          <Link href="/portal/knowledge" className="px-2.5 py-1.5 rounded-md bg-white/10 whitespace-nowrap">Tri thức</Link>
          <Link href="/portal/giong" className="px-2.5 py-1.5 rounded-md bg-white/10 whitespace-nowrap">Giống</Link>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-4 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:justify-between">
          <div>
            <div className="font-medium text-foreground">Viện Nông nghiệp tỉnh Thanh Hóa</div>
            <div>{labInfo.address}</div>
          </div>
          <div className="sm:text-right">
            <div>Điện thoại: {labInfo.phone}</div>
            <div>Email: {labInfo.email}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
