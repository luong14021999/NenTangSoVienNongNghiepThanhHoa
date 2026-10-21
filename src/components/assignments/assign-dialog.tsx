"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { testNoOf } from "@/lib/accreditation";

const cls = "mt-1 w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm font-normal";

/** Phân công: danh sách KTV tự lọc theo ủy quyền của phép thử đã chọn (M2.2, §6.2.6). */
export function AssignDialog({
  samples,
  tests,
  eligibleByTest,
  workload,
  defaultSample = "",
}: {
  samples: { value: string; label: string }[];
  tests: string[];
  eligibleByTest: Record<number, string[]>;
  workload: Record<string, { open: number; overdue: number }>;
  defaultSample?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sample, setSample] = useState(defaultSample);
  const [test, setTest] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const eligible = test ? eligibleByTest[testNoOf(test)] ?? [] : [];

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sampleCode: sample, testLabel: test, assignee, dueAt, note }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? `HTTP ${res.status}`);
    toast.success("Đã phân công", `${sample} → ${assignee}`);
    startTransition(() => {
      router.refresh();
      setTest("");
      setAssignee("");
      setNote("");
      setOpen(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <Dialog.Trigger asChild>
        <Button size="sm"><UserPlus /> Phân công</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-card border rounded-xl shadow-xl p-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <Dialog.Title className="text-base font-semibold">Phân công chỉ tiêu</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">Chỉ hiện KTV đang có ủy quyền thực hiện phép thử còn hiệu lực</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><X className="w-4 h-4" /></button>
            </Dialog.Close>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium">Mẫu *
              <select value={sample} onChange={(e) => setSample(e.target.value)} className={cls}>
                <option value="">— chọn mẫu —</option>
                {samples.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">Phép thử *
              <select value={test} onChange={(e) => { setTest(e.target.value); setAssignee(""); }} className={cls}>
                <option value="">— chọn phép thử —</option>
                {tests.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">KTV thực hiện *
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} disabled={!test} className={`${cls} disabled:opacity-50`}>
                <option value="">{!test ? "— chọn phép thử trước —" : eligible.length ? "— chọn KTV —" : "Chưa có KTV nào được ủy quyền"}</option>
                {eligible.map((n) => (
                  <option key={n} value={n}>
                    {n} · đang mở {workload[n]?.open ?? 0}{workload[n]?.overdue ? ` · quá hạn ${workload[n].overdue}` : ""}
                  </option>
                ))}
              </select>
              {test && !eligible.length && <span className="text-[11px] text-rose-600 font-normal">Cấp ủy quyền ở trang Ủy quyền phép thử trước khi phân công</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">Hạn hoàn thành
                <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={cls} />
                <span className="text-[10px] text-muted-foreground font-normal">để trống = hạn trả của mẫu</span>
              </label>
              <label className="block text-xs font-medium">Ghi chú
                <input value={note} onChange={(e) => setNote(e.target.value)} className={cls} />
              </label>
            </div>
          </div>
          {error && <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-2.5 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
            <Dialog.Close asChild><Button variant="outline" type="button">Hủy</Button></Dialog.Close>
            <Button onClick={save} disabled={saving || pending || !sample || !test || !assignee}>
              {(saving || pending) && <Loader2 className="w-4 h-4 animate-spin" />} Phân công
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
