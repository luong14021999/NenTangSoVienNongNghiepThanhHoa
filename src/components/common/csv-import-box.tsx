"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Ô dán dữ liệu từ Excel / CSV gửi tới API nhập hàng loạt ({ csv }); hiển thị lỗi theo dòng. */
export function CsvImportBox({ endpoint, example, help, label = "Nhập dữ liệu" }: { endpoint: string; example: string; help: string; label?: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const [pending, startTransition] = useTransition();

  async function submit() {
    setErrors([]);
    setBusy(true);
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(data.errors ?? []);
      return toast.error("Chưa nhập được", data.error ?? `HTTP ${res.status}`);
    }
    toast.success(`Đã nhập ${data.imported} dòng`);
    setCsv("");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-2">
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} placeholder={example} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono" />
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={submit} disabled={!csv.trim() || busy || pending}>{busy || pending ? <Loader2 className="animate-spin" /> : <Upload />} {label}</Button>
        <span className="text-[11px] text-muted-foreground">{help}</span>
      </div>
      {errors.length > 0 && (
        <ul className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2 space-y-0.5">
          {errors.map((e) => <li key={e.line}>Dòng {e.line}: {e.message}</li>)}
        </ul>
      )}
    </div>
  );
}
