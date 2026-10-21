"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Pencil, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ROLES, type Role } from "@/lib/platform/permissions";

type Initial = { email: string; fullName: string; roles: Role[]; active: boolean; note: string };

/** Gán vai trò cho 1 tài khoản đăng nhập (email). */
export function RoleEditor({
  initial,
  suggestions = [],
  bootstrapEmail,
}: {
  initial?: Initial;
  suggestions?: { email: string; name: string }[];
  /** Khi chưa bật phân quyền: điền sẵn email người đang đăng nhập + vai trò Quản trị. */
  bootstrapEmail?: string;
}) {
  const blank: Initial = { email: bootstrapEmail ?? "", fullName: "", roles: bootstrapEmail ? ["Quản trị"] : [], active: true, note: "" };
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Initial>(initial ?? blank);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = (r: Role) => setV((x) => ({ ...x, roles: x.roles.includes(r) ? x.roles.filter((y) => y !== r) : [...x.roles, r] }));

  async function save() {
    setSaving(true);
    const res = await fetch("/api/user-roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error("Không lưu được phân quyền", body.error ?? `HTTP ${res.status}`);
    toast.success("Đã lưu phân quyền", `${v.email}: ${v.roles.join(", ") || "không có vai trò"}`);
    startTransition(() => {
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) setV(initial ?? blank); }}>
      <Dialog.Trigger asChild>
        {initial ? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Pencil className="w-3.5 h-3.5" /> Sửa
          </Button>
        ) : (
          <Button size="sm">
            <UserPlus /> {bootstrapEmail ? "Bật phân quyền" : "Gán vai trò"}
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <Dialog.Title className="text-base font-semibold">{initial ? `Sửa phân quyền – ${initial.email}` : bootstrapEmail ? "Bật phân quyền theo vai trò" : "Gán vai trò cho tài khoản"}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><X className="w-4 h-4" /></button>
            </Dialog.Close>
          </div>
          {bootstrapEmail && (
            <div className="mb-3 text-xs rounded-md border border-amber-300 bg-amber-50 text-amber-800 p-2.5">
              Sau khi lưu, chỉ tài khoản có vai trò mới được ghi dữ liệu. Lần đầu phải gán Quản trị cho chính bạn.
            </div>
          )}
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Email đăng nhập *
              <input
                list="staff-emails"
                value={v.email}
                disabled={Boolean(initial)}
                onChange={(e) => {
                  const email = e.target.value;
                  const s = suggestions.find((x) => x.email === email);
                  setV((x) => ({ ...x, email, fullName: s && !x.fullName ? s.name : x.fullName }));
                }}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-normal disabled:opacity-60"
              />
              <datalist id="staff-emails">
                {suggestions.map((s) => <option key={s.email} value={s.email}>{s.name}</option>)}
              </datalist>
            </label>
            <label className="block text-sm font-medium">
              Họ tên
              <input value={v.fullName} onChange={(e) => setV((x) => ({ ...x, fullName: e.target.value }))} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-normal" />
            </label>
            <fieldset>
              <legend className="text-sm font-medium mb-1">Vai trò</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm rounded-md border px-2.5 py-1.5 cursor-pointer hover:bg-accent">
                    <input type="checkbox" checked={v.roles.includes(r)} onChange={() => toggle(r)} />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={v.active} onChange={(e) => setV((x) => ({ ...x, active: e.target.checked }))} />
              Tài khoản đang hoạt động
            </label>
            <label className="block text-sm font-medium">
              Ghi chú
              <input value={v.note} onChange={(e) => setV((x) => ({ ...x, note: e.target.value }))} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-normal" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
            <Dialog.Close asChild><Button variant="outline" type="button">Hủy</Button></Dialog.Close>
            <Button onClick={save} disabled={saving || pending || !v.email}>
              {(saving || pending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
