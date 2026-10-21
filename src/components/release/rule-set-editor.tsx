"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, FilePen, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { LEVELS, RULE_INFO, type Level, type ReleaseRules } from "@/lib/release-checks";

const levelClass: Record<Level, string> = {
  "Chặn": "text-rose-700",
  "Cảnh báo": "text-amber-700",
  "Tắt": "text-muted-foreground",
};

/** Soạn phiên bản mới của bộ quy tắc (gửi lên thành Dự thảo). */
export function RuleSetEditor({ current, disabled }: { current: ReleaseRules; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<ReleaseRules>(current);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const setLevel = (key: keyof ReleaseRules, level: Level) =>
    setRules((r) => {
      const v = r[key];
      return { ...r, [key]: typeof v === "string" ? level : { ...v, level } };
    });

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/release-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules, note }),
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Không tạo được dự thảo", body.error ?? `HTTP ${res.status}`);
      return;
    }
    toast.success(`Đã tạo dự thảo phiên bản ${body.item.version}`, "Cần người khác phê duyệt để có hiệu lực");
    startTransition(() => {
      router.refresh();
      setOpen(false);
      setNote("");
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) setRules(current); }}>
      <Dialog.Trigger asChild>
        <Button size="sm" disabled={disabled}>
          <FilePen />
          Soạn phiên bản mới
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-2xl bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">Soạn phiên bản mới – quy tắc kiểm soát trước phát hành</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Bản soạn là Dự thảo; chỉ có hiệu lực khi một người khác phê duyệt.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="rounded-lg border divide-y">
            {RULE_INFO.map((info) => {
              const v = rules[info.key];
              const level = typeof v === "string" ? v : v.level;
              return (
                <div key={info.key} className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 text-sm">
                    {info.label} <span className="text-[11px] text-muted-foreground">{info.clause}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {info.key === "rsd" && (
                      <label className="text-xs flex items-center gap-1">
                        ≤
                        <input
                          type="number"
                          step="any"
                          value={rules.rsd.max}
                          onChange={(e) => setRules((r) => ({ ...r, rsd: { ...r.rsd, max: Number(e.target.value) } }))}
                          className="w-16 h-8 rounded border border-input px-1.5 text-sm"
                        />
                        %
                      </label>
                    )}
                    {info.key === "recovery" && (
                      <label className="text-xs flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={rules.recovery.min}
                          onChange={(e) => setRules((r) => ({ ...r, recovery: { ...r.recovery, min: Number(e.target.value) } }))}
                          className="w-14 h-8 rounded border border-input px-1.5 text-sm"
                        />
                        –
                        <input
                          type="number"
                          step="any"
                          value={rules.recovery.max}
                          onChange={(e) => setRules((r) => ({ ...r, recovery: { ...r.recovery, max: Number(e.target.value) } }))}
                          className="w-14 h-8 rounded border border-input px-1.5 text-sm"
                        />
                        %
                      </label>
                    )}
                    <select
                      aria-label={`Mức – ${info.label}`}
                      value={level}
                      onChange={(e) => setLevel(info.key, e.target.value as Level)}
                      className={`h-8 rounded-md border border-input bg-background px-2 text-sm font-medium ${levelClass[level]}`}
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
          <label className="block mt-3 text-sm font-medium">
            Nội dung / lý do thay đổi *
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="VD: Siết RSD ≤ 3% cho phép thử kim loại nặng theo kết quả đánh giá nội bộ DGNB-2026-02"
            />
          </label>
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
            <Dialog.Close asChild>
              <Button variant="outline" type="button">Hủy</Button>
            </Dialog.Close>
            <Button onClick={submit} disabled={saving || pending || !note.trim()}>
              {(saving || pending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo dự thảo
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Phê duyệt / huỷ dự thảo. */
export function DraftActions({ id }: { id: string }) {
  const [busy, setBusy] = useState<"approve" | "discard" | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  async function run(kind: "approve" | "discard") {
    setBusy(kind);
    const res = await fetch(kind === "approve" ? `/api/release-rules/${id}/approve` : `/api/release-rules/${id}`, {
      method: kind === "approve" ? "POST" : "DELETE",
    });
    setBusy(null);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(kind === "approve" ? "Không phê duyệt được" : "Không huỷ được", body.error ?? `HTTP ${res.status}`);
      return;
    }
    toast.success(kind === "approve" ? `Phiên bản ${body.item?.version} đã có hiệu lực` : "Đã huỷ dự thảo");
    startTransition(() => router.refresh());
  }
  const loading = Boolean(busy) || pending;
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={loading} onClick={() => run("discard")} className="text-rose-600 border-rose-200 hover:bg-rose-50">
        {busy === "discard" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 />}
        Huỷ dự thảo
      </Button>
      <Button size="sm" disabled={loading} onClick={() => run("approve")}>
        {busy === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 />}
        Phê duyệt ban hành
      </Button>
    </div>
  );
}
