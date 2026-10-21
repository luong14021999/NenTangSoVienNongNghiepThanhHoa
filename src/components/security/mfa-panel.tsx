"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Copy, KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type Status = { email: string; enabled: boolean; pending: boolean; required: boolean; recoveryLeft: number };

const codeCls =
  "block w-full h-11 rounded-lg border border-input bg-background px-3.5 text-center text-lg tracking-[0.3em] font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

async function post(action: string, body: object = {}) {
  const res = await fetch(`/api/mfa/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/**
 * Xác thực 2 lớp (M1.1).
 * - mode "gate": trang /mfa sau đăng nhập – nhập mã hoặc đăng ký (khi chính sách bắt buộc) rồi chuyển tiếp `next`.
 * - mode "manage": tự quản lý trong trang An toàn thông tin – bật / gỡ.
 */
export function MfaPanel({ mode, next = "/" }: { mode: "gate" | "manage"; next?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [enroll, setEnroll] = useState<{ secret: string; qr: string } | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/mfa/status");
    if (res.ok) setStatus(await res.json());
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải trạng thái một lần khi mở
    void load();
  }, [load]);

  const go = () => {
    router.replace(next.startsWith("/") ? next : "/");
    router.refresh();
  };

  async function run(action: string) {
    setBusy(true);
    setError(null);
    const { ok, data } = await post(action, { code });
    setBusy(false);
    setCode("");
    if (!ok) return setError(data.error ?? "Thất bại");
    if (action === "confirm") {
      setEnroll(null);
      setRecovery(data.recoveryCodes);
      toast.success("Đã bật xác thực 2 lớp");
      await load();
    } else if (action === "disable") {
      toast.success("Đã gỡ xác thực 2 lớp");
      setDisabling(false);
      await load();
    } else if (mode === "gate") go();
  }

  async function startEnroll() {
    setBusy(true);
    setError(null);
    const { ok, data } = await post("enroll");
    setBusy(false);
    if (!ok) return setError(data.error ?? "Thất bại");
    setEnroll({ secret: data.secret, qr: data.qr });
  }

  if (!status) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải…</div>;

  const codeInput = (onEnter: () => void, placeholder = "123456") => (
    <input
      value={code}
      onChange={(e) => setCode(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && code && onEnter()}
      inputMode="text"
      autoComplete="one-time-code"
      autoFocus
      placeholder={placeholder}
      className={codeCls}
    />
  );
  const err = error && (
    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3.5 py-2.5 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{error}</span>
    </div>
  );

  if (recovery) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 font-medium"><CheckCircle2 className="w-5 h-5" /> Đã bật xác thực 2 lớp</div>
        <p className="text-sm text-muted-foreground">
          Lưu 8 mã khôi phục dưới đây ở nơi an toàn (in ra hoặc lưu trong trình quản lý mật khẩu). Mỗi mã dùng được một lần khi mất điện thoại.
          <b> Mã chỉ hiển thị một lần.</b>
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 font-mono text-sm">
          {recovery.map((c) => <span key={c}>{c}</span>)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(recovery.join("\n")); toast.success("Đã sao chép"); }}>
            <Copy /> Sao chép
          </Button>
          <Button size="sm" onClick={() => (mode === "gate" ? go() : setRecovery(null))}>Tôi đã lưu mã – tiếp tục</Button>
        </div>
      </div>
    );
  }

  if (enroll) {
    return (
      <div className="space-y-4">
        <ol className="text-sm space-y-1 list-decimal pl-5 text-muted-foreground">
          <li>Cài ứng dụng xác thực trên điện thoại (Google Authenticator, Microsoft Authenticator…).</li>
          <li>Quét mã QR (hoặc nhập khóa thủ công).</li>
          <li>Nhập mã 6 chữ số ứng dụng hiển thị để xác nhận.</li>
        </ol>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-44 h-44 shrink-0 bg-white rounded-lg border p-1 [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: enroll.qr }} />
          <div className="text-xs space-y-1 min-w-0">
            <div className="text-muted-foreground">Khóa nhập thủ công:</div>
            <div className="font-mono break-all bg-muted rounded px-2 py-1">{enroll.secret.match(/.{1,4}/g)?.join(" ")}</div>
            <div className="text-muted-foreground">Loại: theo thời gian · 6 chữ số · 30 giây</div>
          </div>
        </div>
        {codeInput(() => run("confirm"))}
        {err}
        <Button className="w-full" onClick={() => run("confirm")} disabled={busy || code.length < 6}>
          {busy && <Loader2 className="animate-spin" />} Xác nhận và bật
        </Button>
      </div>
    );
  }

  if (mode === "gate" && status.enabled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Nhập mã 6 chữ số trong ứng dụng xác thực cho <b className="text-foreground">{status.email}</b>. Mất điện thoại? Nhập một mã khôi phục dạng <span className="font-mono">xxxx-xxxx</span>.
        </p>
        {codeInput(() => run("verify"))}
        {err}
        <Button className="w-full h-11" onClick={() => run("verify")} disabled={busy || code.length < 6}>
          {busy && <Loader2 className="animate-spin" />} Xác nhận
        </Button>
      </div>
    );
  }

  if (!status.enabled) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <ShieldOff className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <span>Chưa bật xác thực 2 lớp cho <b className="break-all">{status.email}</b></span>
        </div>
        {status.required && <p className="text-sm text-rose-700">Chính sách của hệ thống bắt buộc xác thực 2 lớp – cần đăng ký để tiếp tục.</p>}
        {err}
        <Button onClick={startEnroll} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <KeyRound />} Đăng ký xác thực 2 lớp
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 text-sm">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
        <span>Đã bật xác thực 2 lớp cho <b className="break-all">{status.email}</b> · còn {status.recoveryLeft} mã khôi phục</span>
      </div>
      {!disabling ? (
        <Button variant="outline" size="sm" onClick={() => setDisabling(true)}><ShieldOff /> Gỡ xác thực 2 lớp</Button>
      ) : (
        <div className="space-y-2 max-w-xs">
          <p className="text-xs text-muted-foreground">Nhập mã hiện tại (hoặc mã khôi phục) để gỡ.</p>
          {codeInput(() => run("disable"))}
          {err}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setDisabling(false); setError(null); }}>Hủy</Button>
            <Button variant="destructive" size="sm" onClick={() => run("disable")} disabled={busy || code.length < 6}>
              {busy && <Loader2 className="animate-spin" />} Gỡ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
