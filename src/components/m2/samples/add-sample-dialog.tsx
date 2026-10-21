"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUSES = [
  "Đã tiếp nhận",
  "Đang phân tích",
  "Chờ duyệt",
  "Hoàn thành",
  "Đã trả KQ",
];

export function AddSampleDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const criteriaRaw = String(formData.get("criteria") ?? "");
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      customer: String(formData.get("customer") ?? "").trim(),
      type: String(formData.get("type") ?? "").trim(),
      receivedAt: String(formData.get("receivedAt") ?? ""),
      dueAt: String(formData.get("dueAt") ?? ""),
      technician: String(formData.get("technician") ?? "").trim(),
      status: String(formData.get("status") ?? "Đã tiếp nhận"),
      progress: Number(formData.get("progress") ?? 0),
      criteria: criteriaRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const res = await fetch("/api/samples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `HTTP ${res.status}`);
      return;
    }
    startTransition(() => {
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <Plus />
          Tạo mẫu mới
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Tiếp nhận mẫu mới
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Ghi vào <code className="font-mono">data/samples.json</code>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <form action={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code">Mã mẫu *</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="260626-12/1"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="Đã tiếp nhận"
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer">Khách hàng *</Label>
              <Input id="customer" name="customer" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Loại mẫu *</Label>
              <Input id="type" name="type" required placeholder="Đất / Nước / Rau ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="receivedAt">Ngày nhận</Label>
                <Input
                  id="receivedAt"
                  name="receivedAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueAt">Hạn trả</Label>
                <Input id="dueAt" name="dueAt" type="date" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technician">KTV phụ trách</Label>
              <Input id="technician" name="technician" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="criteria">Chỉ tiêu phân tích (cách bằng dấu phẩy)</Label>
              <Input
                id="criteria"
                name="criteria"
                placeholder="pHKCl, OM%, N tổng, P2O5..."
              />
            </div>
            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">
                  Hủy
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu mẫu
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
