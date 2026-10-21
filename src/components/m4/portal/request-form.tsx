"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { REQUEST_KINDS } from "@/lib/modules/m4/portal";

const input = "w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function PublicRequestForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code?: string; targetUnit?: string; phone: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    setBusy(true);
    try {
      const res = await fetch("/api/public/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sampleCount: Number(body.sampleCount || 0) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Không gửi được yêu cầu, vui lòng thử lại");
      setDone({ code: data.code, targetUnit: data.targetUnit, phone: String(body.phone ?? "") });
    } catch {
      setError("Mất kết nối, vui lòng thử lại");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border-2 border-emerald-500 bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="w-6 h-6 text-emerald-600" />Đã gửi yêu cầu</div>
        {done.code && (
          <>
            <p className="text-sm mt-3">Mã yêu cầu của bạn (vui lòng ghi lại để tra cứu):</p>
            <div className="mt-1 text-2xl font-mono font-bold tracking-wider select-all">{done.code}</div>
            <p className="text-sm text-muted-foreground mt-2">Yêu cầu được chuyển đến: <span className="text-foreground font-medium">{done.targetUnit}</span>. Cán bộ sẽ liên hệ theo số điện thoại bạn cung cấp.</p>
          </>
        )}
        <div className="flex flex-wrap gap-2 mt-5">
          <Link href={`/portal/status${done.code ? `?code=${encodeURIComponent(done.code)}` : ""}`} className="h-9 px-3 inline-flex items-center rounded-md bg-primary text-primary-foreground text-sm">Tra cứu tình trạng</Link>
          <button onClick={() => setDone(null)} className="h-9 px-3 rounded-md border text-sm hover:bg-accent">Gửi yêu cầu khác</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border bg-card p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Ô bẫy bot (honeypot) – ẩn với người dùng và trình đọc màn hình */}
      <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="space-y-1.5 sm:col-span-2 text-sm">
        <span className="font-medium">Loại dịch vụ *</span>
        <select name="kind" required defaultValue="" className={input}>
          <option value="" disabled>— Chọn loại dịch vụ —</option>
          {REQUEST_KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Họ tên người liên hệ *</span>
        <input name="contactName" required maxLength={100} className={input} autoComplete="name" />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Số điện thoại *</span>
        <input name="phone" required inputMode="tel" maxLength={20} className={input} autoComplete="tel" placeholder="VD: 0912 345 678" />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Tổ chức / hộ gia đình</span>
        <input name="orgName" maxLength={200} className={input} autoComplete="organization" />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Email</span>
        <input name="email" type="email" maxLength={200} className={input} autoComplete="email" />
      </label>
      <label className="space-y-1.5 sm:col-span-2 text-sm">
        <span className="font-medium">Địa chỉ</span>
        <input name="address" maxLength={300} className={input} autoComplete="street-address" />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Số mẫu / số lượng (nếu có)</span>
        <input name="sampleCount" type="number" min={0} max={10000} className={input} />
      </label>
      <label className="space-y-1.5 sm:col-span-2 text-sm">
        <span className="font-medium">Nội dung yêu cầu *</span>
        <textarea name="description" required minLength={10} maxLength={3000} rows={5} placeholder="VD: Phân tích 10 mẫu đất trồng lúa: pH, OM, N, P, K dễ tiêu…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </label>
      {error && <div className="sm:col-span-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</div>}
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground max-w-md">Thông tin chỉ dùng để Viện liên hệ, báo giá và thực hiện dịch vụ.</p>
        <button disabled={busy} className="h-10 px-5 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Gửi yêu cầu
        </button>
      </div>
    </form>
  );
}
