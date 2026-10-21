"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { moduleOf } from "@/components/layout/nav-config";

/**
 * Gắn bộ màu của phần mềm đang mở (`data-module`, xem globals.css).
 * Đặt cả trên <html> để hộp thoại / menu thả xuống (render qua portal ra ngoài khung) cũng đúng màu.
 */
export function ModuleScope({ className, children }: { className?: string; children: React.ReactNode }) {
  const key = moduleOf(usePathname())?.key;

  useEffect(() => {
    const root = document.documentElement;
    if (key) root.dataset.module = key;
    else delete root.dataset.module;
    return () => {
      delete root.dataset.module;
    };
  }, [key]);

  return (
    <div data-module={key} className={className}>
      {children}
    </div>
  );
}
