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
  title: "Phòng phân tích Đất, nước, phân bón và môi trường – Viện Nông nghiệp tỉnh Thanh Hóa",
  description:
    "Hệ thống quản lý phòng thí nghiệm phân tích môi trường – đất – nước – phân bón – an toàn thực phẩm, vận hành theo ISO/IEC 17025",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-vnnth.png",
    apple: "/logo-vnnth.png",
    shortcut: "/logo-vnnth.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LIMS VNNTH",
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
