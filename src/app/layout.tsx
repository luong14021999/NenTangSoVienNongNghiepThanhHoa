import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const viewport: Viewport = {
  themeColor: "#1d8048",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa",
  description:
    "Nền tảng số dùng chung của Viện: phòng thí nghiệm (LIMS, VILAS 1501), dịch vụ KH&CN, nuôi cấy mô, giống cây trồng – một tài khoản cho tất cả phân hệ",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-vnnth.png",
    apple: "/logo-vnnth.png",
    shortcut: "/logo-vnnth.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VNN Thanh Hóa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
