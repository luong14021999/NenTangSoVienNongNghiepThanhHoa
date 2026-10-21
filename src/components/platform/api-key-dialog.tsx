"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Copy, KeyRound, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const cls = "mt-1 w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm font-normal";

/** Cấp khóa API: chọn phạm vi; khóa đầy đủ chỉ hiện một lần sau khi tạo. */
export function ApiKeyDialog({ scopes, defaultRate }: { scopes: Record<string, string>; defaultRate: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [rate, setRate] = useState(String(defaultRate));
  const [expires, setExpires] = useState("");
  const [note, setNote] = useState("");
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function reset() {
    setName(""); setOrg(""); setPicked([]); setRate(String(defaultRate)); setExpires(""); setNote(""); setKey(null); setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/api-clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, organization: org, scopes: picked, rateLimit: rate, expiresAt: expires, note }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? `HTTP ${res.status}`);
    setKey(data.key);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Dialog.Trigger asChild><Button size="sm"><KeyRound /> Cấp khóa API</Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">Cấp khóa API cho hệ thống bên ngoài</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">Hệ thống chỉ lưu mã băm – khóa đầy đủ hiển thị một lần</Dialog.Description>
            </div>
            <Dialog.Close asChild><button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><X className="w-4 h-4" /></button></Dialog.Close>
          </div>
          {key ? (
            <div className="space-y-3">
              <div className="text-sm">Khóa của <b>{name}</b>. Sao chép và gửi cho đơn vị quản trị hệ thống đó qua kênh an toàn:</div>
              <div className="font-mono text-xs break-all rounded-lg border bg-muted/50 p-3">{key}</div>
              <div className="text-xs text-rose-600">Sau khi đóng hộp thoại sẽ không xem lại được. Mất khóa → thu hồi và cấp khóa mới.</div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(key); toast.success("Đã sao chép khóa"); }}><Copy /> Sao chép</Button>
                <Dialog.Close asChild><Button size="sm">Đã lưu – đóng</Button></Dialog.Close>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-medium">Hệ thống sử dụng *<input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: LGSP Thanh Hóa" className={cls} /></label>
              <label className="block text-xs font-medium">Đơn vị quản lý<input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="VD: Sở KH&CN Thanh Hóa" className={cls} /></label>
              <fieldset>
                <legend className="text-xs font-medium mb-1">Phạm vi truy cập *</legend>
                <div className="space-y-1">
                  {Object.entries(scopes).map(([k, v]) => (
                    <label key={k} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-1" checked={picked.includes(k)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, k] : p.filter((x) => x !== k)))} />
                      <span><span className="font-mono text-xs">{k}</span> – {v}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium">Giới hạn (lượt / phút)<input type="number" min={0} value={rate} onChange={(e) => setRate(e.target.value)} className={cls} /><span className="text-[10px] text-muted-foreground font-normal">0 = không giới hạn</span></label>
                <label className="block text-xs font-medium">Hết hạn<input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={cls} /><span className="text-[10px] text-muted-foreground font-normal">để trống = không hết hạn</span></label>
              </div>
              <label className="block text-xs font-medium">Ghi chú<input value={note} onChange={(e) => setNote(e.target.value)} className={cls} /></label>
              {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">{error}</div>}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Dialog.Close asChild><Button variant="outline" type="button">Hủy</Button></Dialog.Close>
                <Button onClick={save} disabled={busy || !name.trim() || !picked.length}>{busy && <Loader2 className="animate-spin" />} Cấp khóa</Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
