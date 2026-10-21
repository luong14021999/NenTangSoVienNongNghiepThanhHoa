"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { FileSignature, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";

/** Xác thực lại bằng mật khẩu (tạo phiên mới) – điều kiện để server chấp nhận chữ ký điện tử. */
export async function reauthenticate(email: string, password: string) {
  const { error } = await authClient.signIn.email({ email, password });
  if (error) throw new Error(error.code === "INVALID_EMAIL_OR_PASSWORD" ? "Sai mật khẩu" : error.message ?? "Xác thực thất bại");
}

type Field = { name: string; label: string; required?: boolean; placeholder?: string; defaultValue?: string; multiline?: boolean };

/**
 * Hộp thoại ký điện tử: nhập các trường (lý do, ghi chú…) + mật khẩu → xác thực lại → gọi API.
 * `meaning` hiển thị ý nghĩa chữ ký, VD "Phát hành phiếu kết quả".
 */
export function SignDialog({
  email,
  meaning,
  title,
  description,
  endpoint,
  fields = [],
  extraBody = {},
  triggerLabel,
  variant = "default",
  disabled,
  disabledReason,
}: {
  email: string;
  meaning: string;
  title: string;
  description?: string;
  endpoint: string;
  fields?: Field[];
  extraBody?: Record<string, unknown>;
  triggerLabel: string;
  variant?: "default" | "danger";
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function sign() {
    setError(null);
    for (const f of fields) {
      if (f.required && !(values[f.name] ?? f.defaultValue ?? "").trim()) return setError(`Thiếu: ${f.label}`);
    }
    setBusy(true);
    try {
      await reauthenticate(email, password);
      const body = { ...extraBody, ...Object.fromEntries(fields.map((f) => [f.name, values[f.name] ?? f.defaultValue ?? ""])) };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      toast.success(`Đã ký: ${meaning}`, data.item?.code ?? data.item?.status ?? "");
      setPassword("");
      setValues({});
      startTransition(() => {
        router.refresh();
        setOpen(false);
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const loading = busy || pending;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <Dialog.Trigger asChild>
        <Button
          size="sm"
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          className={variant === "danger" ? "bg-rose-600 text-white hover:bg-rose-700" : undefined}
        >
          <FileSignature />
          {triggerLabel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md bg-card border rounded-xl shadow-xl p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-xs text-muted-foreground">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sign();
            }}
            className="space-y-3"
          >
            {fields.map((f) => (
              <label key={f.name} className="block text-sm font-medium">
                {f.label}
                {f.required ? " *" : ""}
                {f.multiline ? (
                  <textarea
                    rows={3}
                    defaultValue={f.defaultValue}
                    placeholder={f.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal"
                  />
                ) : (
                  <input
                    defaultValue={f.defaultValue}
                    placeholder={f.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                  />
                )}
              </label>
            ))}
            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
              <div>
                Ký điện tử: <span className="font-semibold">{meaning}</span> · tài khoản <span className="font-mono">{email}</span>
              </div>
              <label className="block text-sm font-medium">
                Mật khẩu (xác thực lại) *
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
                  required
                />
              </label>
              <div className="text-muted-foreground">Nội dung được băm SHA-256 và gắn với chữ ký; mọi chỉnh sửa sau khi ký sẽ bị phát hiện.</div>
            </div>
            {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">{error}</div>}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">Hủy</Button>
              </Dialog.Close>
              <Button type="submit" disabled={loading || !password} className={variant === "danger" ? "bg-rose-600 text-white hover:bg-rose-700" : undefined}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Ký & {triggerLabel.toLowerCase()}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
