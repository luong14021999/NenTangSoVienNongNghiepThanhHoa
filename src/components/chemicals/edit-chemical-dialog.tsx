"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, X, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Chemical } from "@/lib/mock-data";

export function EditChemicalDialog({ row }: { row: Chemical }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const usedForRaw = String(formData.get("usedFor") ?? "");
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      technicalSpec: String(formData.get("technicalSpec") ?? "").trim(),
      manufactureDate: String(formData.get("manufactureDate") ?? ""),
      storageCondition: String(formData.get("storageCondition") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      usedFor: usedForRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      receivedAt: String(formData.get("receivedAt") ?? ""),
      expiry: String(formData.get("expiry") ?? ""),
    };
    const res = await fetch(`/api/chemicals/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? `HTTP ${res.status}`;
      setError(message);
      toast.error("Cập nhật thất bại", message);
      return;
    }
    toast.success("Cập nhật thành công", `Đã lưu "${row.name}"`);
    startTransition(() => {
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          aria-label={`Sửa ${row.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
          Sửa
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-xl bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                Sửa hóa chất, chất chuẩn
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                {row.code} · {row.name}
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
                <Label htmlFor="code">Mã hiệu *</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  defaultValue={row.code}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên hóa chất *</Label>
                <Input id="name" name="name" required defaultValue={row.name} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technicalSpec">Đặc tính kỹ thuật</Label>
              <Input
                id="technicalSpec"
                name="technicalSpec"
                defaultValue={row.technicalSpec}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="manufactureDate">Ngày sản xuất</Label>
                <Input
                  id="manufactureDate"
                  name="manufactureDate"
                  type="date"
                  defaultValue={row.manufactureDate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="receivedAt">Ngày nhận</Label>
                <Input
                  id="receivedAt"
                  name="receivedAt"
                  type="date"
                  defaultValue={row.receivedAt}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiry">Hạn sử dụng</Label>
                <Input
                  id="expiry"
                  name="expiry"
                  type="date"
                  defaultValue={row.expiry}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="storageCondition">Điều kiện bảo quản</Label>
                <Input
                  id="storageCondition"
                  name="storageCondition"
                  defaultValue={row.storageCondition}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Vị trí bảo quản</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={row.location}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usedFor">
                Dùng cho phép thử (cách nhau bằng dấu phẩy)
              </Label>
              <Input
                id="usedFor"
                name="usedFor"
                defaultValue={row.usedFor.join(", ")}
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
                Cập nhật
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
