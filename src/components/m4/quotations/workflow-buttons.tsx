"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { QUOTATION_ACTIONS, type QuotationAction } from "@/lib/modules/m4/finance";

/** Bước cần ghi lý do. */
const NEEDS_NOTE: QuotationAction[] = ["return", "decline"];
const PRIMARY: QuotationAction[] = ["submit", "approve", "send", "accept"];

export function QuotationWorkflowButtons({ id, actions }: { id: string; actions: QuotationAction[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<QuotationAction | null>(null);
  const [pending, startTransition] = useTransition();

  async function run(action: QuotationAction) {
    let note = "";
    if (NEEDS_NOTE.includes(action)) {
      const v = window.prompt(action === "return" ? "Lý do trả lại để sửa:" : "Lý do khách từ chối:");
      if (v === null) return;
      note = v.trim();
    } else if (!window.confirm(`${QUOTATION_ACTIONS[action]}?`)) return;
    setBusy(action);
    const res = await fetch(`/api/quotations/${id}/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setBusy(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không thực hiện được", data.error ?? `HTTP ${res.status}`);
    toast.success(QUOTATION_ACTIONS[action]);
    startTransition(() => router.refresh());
  }

  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button key={a} size="sm" variant={PRIMARY.includes(a) ? "default" : "outline"} disabled={Boolean(busy) || pending} onClick={() => run(a)}>
          {busy === a && <Loader2 className="animate-spin" />} {QUOTATION_ACTIONS[a]}
        </Button>
      ))}
    </div>
  );
}
