"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Nút gọi API (POST/PATCH/DELETE) rồi làm mới trang; có hỏi xác nhận tùy chọn. */
export function ActionButton({
  url,
  method = "POST",
  body,
  label,
  confirm,
  success = "Đã thực hiện",
  variant = "outline",
  size = "sm",
  icon,
}: {
  url: string;
  method?: "POST" | "PATCH" | "DELETE";
  body?: unknown;
  label: string;
  confirm?: string;
  success?: string;
  variant?: "outline" | "default" | "destructive" | "ghost" | "secondary";
  size?: "sm" | "default";
  icon?: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không thực hiện được", data.error ?? `HTTP ${res.status}`);
    toast.success(success);
    startTransition(() => router.refresh());
  }
  return (
    <Button variant={variant} size={size} onClick={run} disabled={busy || pending}>
      {busy || pending ? <Loader2 className="animate-spin" /> : icon} {label}
    </Button>
  );
}
