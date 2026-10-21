"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type Def = { key: string; label: string; type: "bool" | "number" | "text"; value: unknown; updatedBy?: string; updatedAt?: string };
const cls = "h-9 rounded-md border border-input bg-background px-2.5 text-sm";

/** Biểu mẫu cấu hình hệ thống (M1.8). */
export function SettingsForm({ defs, disabled }: { defs: Def[]; disabled: boolean }) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, unknown>>(Object.fromEntries(defs.map((d) => [d.key, d.value])));
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  async function save() {
    setBusy(true);
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vals) });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không lưu được", data.error);
    toast.success(data.changed ? `Đã lưu ${data.changed} thay đổi` : "Không có thay đổi");
    startTransition(() => router.refresh());
  }
  return (
    <div className="space-y-3">
      {defs.map((d) => (
        <div key={d.key} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
          <label htmlFor={d.key} className="text-sm flex-1">
            {d.label}
            <span className="block text-[11px] text-muted-foreground font-mono">{d.key}{d.updatedBy ? ` · sửa bởi ${d.updatedBy}` : ""}</span>
          </label>
          {d.type === "bool" ? (
            <input id={d.key} type="checkbox" disabled={disabled} checked={Boolean(vals[d.key])} onChange={(e) => setVals((v) => ({ ...v, [d.key]: e.target.checked }))} className="h-4 w-4" />
          ) : (
            <input
              id={d.key}
              type={d.type === "number" ? "number" : "text"}
              min={0}
              disabled={disabled}
              value={String(vals[d.key] ?? "")}
              onChange={(e) => setVals((v) => ({ ...v, [d.key]: d.type === "number" ? e.target.value : e.target.value }))}
              className={`${cls} ${d.type === "number" ? "w-28" : "w-full sm:w-72"}`}
            />
          )}
        </div>
      ))}
      {!disabled && (
        <div className="flex justify-end pt-2 border-t">
          <Button size="sm" onClick={save} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Lưu cấu hình</Button>
        </div>
      )}
    </div>
  );
}
