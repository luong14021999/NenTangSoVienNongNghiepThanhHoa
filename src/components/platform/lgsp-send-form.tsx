"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const cls = "mt-1 w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm font-normal";
const REF_HINT: Record<string, string> = {
  "danh-muc-phep-thu": "",
  "bao-cao-thong-ke": "Kỳ báo cáo YYYY-MM (để trống = tháng này)",
  "ket-qua-kiem-nghiem": "Mã phiếu kết quả *",
  "danh-muc-dung-chung": "Mã danh mục (để trống = PHEP_THU)",
};

/** Gửi gói dữ liệu lên LGSP / NDXP. */
export function LgspSendForm({ services, refs }: { services: Record<string, string>; refs: { reports: string[]; catalogs: string[] } }) {
  const router = useRouter();
  const [channel, setChannel] = useState("LGSP");
  const [service, setService] = useState(Object.keys(services)[0]);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function send() {
    setBusy(true);
    const res = await fetch("/api/integration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel, service, ref }) });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) toast.success(`Đã gửi ${channel} (${data.mode})`, (data.response as { maTiepNhan?: string })?.maTiepNhan);
    else toast.error("Gửi thất bại", data.error ?? data.status ?? `HTTP ${res.status}`);
    startTransition(() => router.refresh());
  }

  const list = service === "ket-qua-kiem-nghiem" ? refs.reports : service === "danh-muc-dung-chung" ? refs.catalogs : [];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr_auto] gap-3 items-end">
      <label className="block text-xs font-medium">Kênh
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className={cls}><option>LGSP</option><option>NDXP</option></select>
      </label>
      <label className="block text-xs font-medium">Dịch vụ
        <select value={service} onChange={(e) => { setService(e.target.value); setRef(""); }} className={cls}>
          {Object.entries(services).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium">{REF_HINT[service] || "Tham số"}
        {list.length ? (
          <select value={ref} onChange={(e) => setRef(e.target.value)} className={cls}>
            <option value="">—</option>
            {list.map((r) => <option key={r}>{r}</option>)}
          </select>
        ) : (
          <input value={ref} onChange={(e) => setRef(e.target.value)} disabled={!REF_HINT[service]} placeholder={service === "bao-cao-thong-ke" ? "2026-10" : ""} className={`${cls} disabled:opacity-50`} />
        )}
      </label>
      <Button onClick={send} disabled={busy || (service === "ket-qua-kiem-nghiem" && !ref)}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Gửi</Button>
    </div>
  );
}
