"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const field = "h-9 w-28 rounded-md border border-input bg-background px-2 text-sm";

/** Nhập tay 1 lần đo phòng nuôi khi thiết bị chưa kết nối. */
export function ReadingForm({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const at = String(fd.get("at") ?? "");
    setBusy(true);
    const res = await fetch(`/api/growth-rooms/${roomId}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: fd.get("temperature") || null,
        humidity: fd.get("humidity") || null,
        light: fd.get("light") || null,
        at: at ? new Date(at).toISOString() : null,
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không ghi được", data.error ?? `HTTP ${res.status}`);
    toast.success("Đã ghi số liệu");
    form.reset();
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="text-xs space-y-1"><span className="text-muted-foreground block">Thời điểm (trống = bây giờ)</span><input name="at" type="datetime-local" className="h-9 rounded-md border border-input bg-background px-2 text-sm" /></label>
      <label className="text-xs space-y-1"><span className="text-muted-foreground block">Nhiệt độ (°C)</span><input name="temperature" type="number" step="any" className={field} /></label>
      <label className="text-xs space-y-1"><span className="text-muted-foreground block">Độ ẩm (%)</span><input name="humidity" type="number" step="any" className={field} /></label>
      <label className="text-xs space-y-1"><span className="text-muted-foreground block">Ánh sáng (lux)</span><input name="light" type="number" step="any" className={field} /></label>
      <Button type="submit" size="sm" disabled={busy || pending} className="h-9">
        {busy || pending ? <Loader2 className="animate-spin" /> : <Plus />} Ghi
      </Button>
    </form>
  );
}
