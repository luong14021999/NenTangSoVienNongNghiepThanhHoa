"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";

const input = "w-full h-10 rounded-md border border-input bg-background px-3 text-sm";

/** Khách mua cây giống gửi phản hồi ngay trên trang truy xuất QR. */
export function LotFeedbackForm({ lotCode }: { lotCode: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/public/lot-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd.entries()), lotCode, rating: rating || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Không gửi được phản hồi");
      setDone(true);
    } catch {
      setError("Mất kết nối, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border-2 border-emerald-500 bg-card p-4 flex items-center gap-2 text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Cảm ơn bạn đã phản hồi. Viện sẽ liên hệ nếu cần hỗ trợ kỹ thuật.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border bg-card p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="sm:col-span-2">
        <div className="font-medium">Phản hồi về lô cây giống</div>
        <p className="text-xs text-muted-foreground">Cho Viện biết cây sinh trưởng thế nào để cải thiện chất lượng và hỗ trợ kỹ thuật.</p>
      </div>
      <div className="sm:col-span-2 flex items-center gap-1" role="radiogroup" aria-label="Mức độ hài lòng">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sao`} onClick={() => setRating(n)} className="p-1">
            <Star className={`w-6 h-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-2">Mức độ hài lòng</span>
      </div>
      <label className="text-sm space-y-1"><span>Tỷ lệ cây sống sau trồng (%)</span><input name="survivalPct" type="number" min={0} max={100} className={input} /></label>
      <label className="text-sm space-y-1"><span>Họ tên</span><input name="contactName" maxLength={100} className={input} autoComplete="name" /></label>
      <label className="text-sm space-y-1 sm:col-span-2"><span>Số điện thoại (để Viện hỗ trợ)</span><input name="phone" inputMode="tel" maxLength={20} className={input} autoComplete="tel" /></label>
      <label className="text-sm space-y-1 sm:col-span-2">
        <span>Nội dung *</span>
        <textarea name="content" required minLength={5} maxLength={2000} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </label>
      {error && <div className="sm:col-span-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</div>}
      <div className="sm:col-span-2 flex justify-end">
        <button disabled={busy} className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Gửi phản hồi
        </button>
      </div>
    </form>
  );
}
