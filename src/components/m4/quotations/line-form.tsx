"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type Item = { id: string; code: string; name: string; unit: string; price: number };

const field = "h-9 rounded-md border border-input bg-background px-2 text-sm";

/** Thêm dòng báo giá: chọn dịch vụ trong bảng giá (đơn giá tự lấy) hoặc nhập tay. */
export function QuotationLineForm({ quotationId, items }: { quotationId: string; items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [itemId, setItemId] = useState("");
  const chosen = items.find((i) => i.id === itemId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    const res = await fetch(`/api/quotations/${quotationId}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceItemId: itemId || undefined,
        description: String(fd.get("description") ?? ""),
        unit: String(fd.get("unit") ?? ""),
        quantity: Number(fd.get("quantity") || 1),
        unitPrice: fd.get("unitPrice") ? Number(fd.get("unitPrice")) : undefined,
        discountPct: Number(fd.get("discountPct") || 0),
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không thêm được dòng", data.error ?? `HTTP ${res.status}`);
    form.reset();
    setItemId("");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 md:grid-cols-[2fr_1.5fr_0.7fr_0.7fr_1fr_0.7fr_auto] gap-2 items-end">
      <label className="col-span-2 md:col-span-1 text-xs space-y-1">
        <span className="text-muted-foreground">Dịch vụ trong bảng giá</span>
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={`${field} w-full`}>
          <option value="">— Nhập tay —</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.code} · {i.name}</option>
          ))}
        </select>
      </label>
      <label className="col-span-2 md:col-span-1 text-xs space-y-1">
        <span className="text-muted-foreground">Nội dung {chosen ? "(để trống = tên dịch vụ)" : ""}</span>
        <input name="description" maxLength={300} placeholder={chosen?.name ?? "Nội dung"} className={`${field} w-full`} />
      </label>
      <label className="text-xs space-y-1">
        <span className="text-muted-foreground">Số lượng</span>
        <input name="quantity" type="number" min={0} step="any" defaultValue={1} className={`${field} w-full`} />
      </label>
      <label className="text-xs space-y-1">
        <span className="text-muted-foreground">ĐVT</span>
        <input name="unit" maxLength={30} placeholder={chosen?.unit ?? "mẫu"} className={`${field} w-full`} />
      </label>
      <label className="text-xs space-y-1">
        <span className="text-muted-foreground">Đơn giá (chưa thuế)</span>
        <input name="unitPrice" type="number" min={0} step="any" placeholder={chosen ? String(chosen.price) : "0"} className={`${field} w-full`} />
      </label>
      <label className="text-xs space-y-1">
        <span className="text-muted-foreground">Giảm %</span>
        <input name="discountPct" type="number" min={0} max={100} step="any" defaultValue={0} className={`${field} w-full`} />
      </label>
      <Button type="submit" size="sm" disabled={busy || pending} className="h-9">
        {busy || pending ? <Loader2 className="animate-spin" /> : <Plus />} Thêm
      </Button>
    </form>
  );
}
