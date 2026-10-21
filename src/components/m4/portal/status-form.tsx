"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type Item = { code: string; kind: string; targetUnit: string; status: string; publicNote: string; createdAt: string };

const input = "w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

const STEPS = ["Mới tiếp nhận", "Đang xử lý", "Đã báo giá", "Đang thực hiện", "Hoàn thành"];

function dt(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function RequestStatusForm({ initialCode = "" }: { initialCode?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [item, setItem] = useState<Item | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setItem(null);
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/public/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fd.get("code"), phone: fd.get("phone") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Không tra cứu được");
      setItem(data.item);
    } catch {
      setError("Mất kết nối, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  }

  const step = item ? STEPS.indexOf(item.status) : -1;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="rounded-xl border bg-card p-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Mã yêu cầu</span>
          <input name="code" required maxLength={32} defaultValue={initialCode} placeholder="YC-2026-XXXXXX" className={`${input} font-mono uppercase`} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Số điện thoại đã đăng ký</span>
          <input name="phone" required inputMode="tel" maxLength={20} className={input} />
        </label>
        <button disabled={busy} className="h-10 px-5 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Tra cứu
        </button>
      </form>
      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</div>}
      {item && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-mono text-lg font-bold">{item.code}</div>
            <div className="text-xs text-muted-foreground">Gửi lúc {dt(item.createdAt)}</div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Loại dịch vụ</dt><dd>{item.kind}</dd>
            <dt className="text-muted-foreground">Đơn vị xử lý</dt><dd>{item.targetUnit}</dd>
            <dt className="text-muted-foreground">Trạng thái</dt>
            <dd className={item.status === "Từ chối" ? "text-rose-700 font-semibold" : "text-emerald-700 font-semibold"}>{item.status}</dd>
          </dl>
          {item.status !== "Từ chối" && (
            <ol className="grid grid-cols-5 gap-1">
              {STEPS.map((s, i) => (
                <li key={s} className="text-[10px] sm:text-xs text-center">
                  <div className={`h-1.5 rounded-full mb-1 ${i <= step ? "bg-primary" : "bg-muted"}`} />
                  <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ol>
          )}
          {item.publicNote && (
            <div className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-line">
              <div className="text-xs text-muted-foreground mb-1">Phản hồi của Viện</div>
              {item.publicNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
