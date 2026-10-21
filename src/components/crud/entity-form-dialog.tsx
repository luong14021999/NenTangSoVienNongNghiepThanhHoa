"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export type CrudFieldType =
  | "text"
  | "number"
  | "date"
  | "datetime-local"
  | "select"
  | "textarea" // nhiều dòng, luôn chiếm cả 2 cột
  | "bool"; // select Đạt/Không đạt → boolean

export type CrudField = {
  name: string;
  label: string;
  type?: CrudFieldType;
  /** Chuỗi = vừa là giá trị vừa là nhãn; {value,label} khi cần lưu mã khác nhãn hiển thị. */
  options?: (string | { value: string; label: string })[];
  required?: boolean;
  placeholder?: string;
  mono?: boolean;
  full?: boolean; // chiếm cả 2 cột
  defaultValue?: string | number; // bool: 0 = mặc định sai
  /** Ô số được để trống → gửi null (VD ngưỡng "không giới hạn"); mặc định trống = 0. */
  nullable?: boolean;
  /** Nhãn [đúng, sai] cho ô bool; mặc định Đạt / Không đạt. */
  boolLabels?: [string, string];
};

const BOOL_TRUE = "Đạt";
const BOOL_FALSE = "Không đạt";
const boolPair = (f: CrudField): [string, string] => f.boolLabels ?? [BOOL_TRUE, BOOL_FALSE];

export function EntityFormDialog({
  mode,
  endpoint,
  id,
  title,
  description,
  fields,
  initial,
  submitLabel = "Lưu",
  addLabel = "Thêm",
}: {
  mode: "add" | "edit";
  endpoint: string; // vd "/api/calibration-logs"
  id?: string;
  title: string;
  description?: string;
  fields: CrudField[];
  initial?: Record<string, unknown>;
  submitLabel?: string;
  addLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = formData.get(f.name);
      if (f.type === "number") {
        payload[f.name] = f.nullable && String(raw ?? "").trim() === "" ? null : Number(raw ?? 0);
      } else if (f.type === "bool") {
        payload[f.name] = String(raw ?? "") === boolPair(f)[0];
      } else {
        let v = String(raw ?? "").trim();
        if (f.type === "datetime-local") v = v.replace("T", " ");
        payload[f.name] = v;
      }
    }
    setSubmitting(true);
    const url = mode === "add" ? endpoint : `${endpoint}/${id}`;
    const res = await fetch(url, {
      method: mode === "add" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error ?? `HTTP ${res.status}`;
      setError(msg);
      toast.error(mode === "add" ? "Thêm thất bại" : "Cập nhật thất bại", msg);
      return;
    }
    toast.success(mode === "add" ? "Đã thêm" : "Cập nhật thành công");
    startTransition(() => {
      router.refresh();
      setOpen(false);
    });
  }

  const loading = submitting || pending;

  function defaultFor(f: CrudField): string {
    const v = initial?.[f.name] ?? f.defaultValue;
    if (f.type === "bool") {
      const [yes, no] = boolPair(f);
      if (v === undefined) return yes;
      return v ? yes : no;
    }
    if (v === undefined || v === null) return "";
    let s = String(v);
    if (f.type === "datetime-local") s = s.replace(" ", "T");
    return s;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {mode === "add" ? (
          <Button size="sm">
            <Plus />
            {addLabel}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            aria-label="Sửa"
            className="h-8 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Pencil className="w-3.5 h-3.5" />
            Sửa
          </Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <form action={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {fields.map((f) => {
                const dv = defaultFor(f);
                return (
                  <div
                    key={f.name}
                    className={`space-y-1.5 ${f.full || f.type === "textarea" ? "col-span-2" : ""}`}
                  >
                    <Label htmlFor={f.name}>
                      {f.label}
                      {f.required ? " *" : ""}
                    </Label>
                    {f.type === "select" || f.type === "bool" ? (
                      <select
                        id={f.name}
                        name={f.name}
                        defaultValue={dv}
                        className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        {(f.type === "bool"
                          ? boolPair(f)
                          : (f.options ?? [])
                        ).map((o) => {
                          const opt = typeof o === "string" ? { value: o, label: o } : o;
                          return (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          );
                        })}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea
                        id={f.name}
                        name={f.name}
                        rows={3}
                        required={f.required}
                        placeholder={f.placeholder}
                        defaultValue={dv}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                      />
                    ) : (
                      <Input
                        id={f.name}
                        name={f.name}
                        type={
                          f.type === "number"
                            ? "number"
                            : f.type === "date"
                              ? "date"
                              : f.type === "datetime-local"
                                ? "datetime-local"
                                : "text"
                        }
                        step={f.type === "number" ? "any" : undefined}
                        required={f.required}
                        placeholder={f.placeholder}
                        defaultValue={dv}
                        className={f.mono ? "font-mono text-sm" : undefined}
                      />
                    )}
                  </div>
                );
              })}
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitLabel}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
