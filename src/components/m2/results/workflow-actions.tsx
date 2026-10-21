"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { SignDialog } from "@/components/platform/sign/sign-dialog";

type Action = "submit" | "qa_approve" | "qa_reject" | "manager_approve" | "manager_reject";

const BY_STATUS: Record<string, { approve?: Action; reject?: Action; title: string; hint: string }> = {
  "Đang nhập": { approve: "submit", title: "KTV nộp kết quả", hint: "Sau khi nộp, kết quả bị khóa – chỉ sửa được khi bị trả lại" },
  "Trả lại sửa": { approve: "submit", title: "KTV sửa & nộp lại", hint: "Sửa theo góp ý rồi nộp lại cho QA/QC" },
  "Chờ QA/QC": { approve: "qa_approve", reject: "qa_reject", title: "QA/QC kiểm tra", hint: "Đối chiếu QC (Westgard, độ thu hồi, mẫu trắng) trước khi duyệt" },
  "Chờ Trưởng phòng": { approve: "manager_approve", reject: "manager_reject", title: "Trưởng phòng phê duyệt", hint: "Phê duyệt để kết quả được đưa vào phiếu kết quả" },
};

const LABEL: Record<Action, string> = {
  submit: "Nộp QA/QC",
  qa_approve: "Duyệt",
  qa_reject: "Trả lại",
  manager_approve: "Phê duyệt",
  manager_reject: "Trả lại",
};

type Can = { enter: boolean; qa: boolean; approve: boolean };

export function WorkflowActions({ id, status, email, can }: { id: string; status: string; email: string; can: Can }) {
  const cfg = BY_STATUS[status];
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!cfg) return null;
  const allowed = cfg.approve === "submit" ? can.enter : cfg.approve === "qa_approve" ? can.qa : can.approve;
  if (!allowed) {
    return (
      <div className="p-4 rounded-lg border bg-muted/30 text-xs text-muted-foreground">
        <div className="text-sm font-semibold text-foreground">{cfg.title}</div>
        Tài khoản của bạn không có vai trò thực hiện bước này (xem Phân quyền).
      </div>
    );
  }

  async function run(action: Action) {
    setBusy(action);
    const res = await fetch(`/api/analysis-results/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment }),
    });
    setBusy(null);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(`${LABEL[action]} thất bại`, body.error ?? `HTTP ${res.status}`);
      return;
    }
    toast.success(`Đã ${LABEL[action].toLowerCase()}`, `Trạng thái: ${body.item?.status ?? ""}`);
    setComment("");
    startTransition(() => router.refresh());
  }

  const loading = Boolean(busy) || pending;
  const ApproveIcon = cfg.approve === "submit" ? Send : CheckCircle2;

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <div>
        <div className="text-sm font-semibold">{cfg.title}</div>
        <div className="text-xs text-muted-foreground">{cfg.hint}</div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={cfg.reject ? "Nhận xét (bắt buộc khi trả lại)…" : "Ghi chú (không bắt buộc)…"}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
      />
      <div className="flex flex-wrap justify-end gap-2">
        {cfg.reject && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => run(cfg.reject!)}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            {busy === cfg.reject ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw />}
            {LABEL[cfg.reject]}
          </Button>
        )}
        {cfg.approve === "manager_approve" ? (
          <SignDialog
            email={email}
            meaning="Phê duyệt kết quả phân tích"
            title="Ký điện tử – phê duyệt kết quả"
            description="Sau khi ký, kết quả bị khóa và được đưa vào phiếu kết quả"
            endpoint={`/api/analysis-results/${id}/transition`}
            extraBody={{ action: "manager_approve", comment }}
            triggerLabel="Phê duyệt"
          />
        ) : cfg.approve && (
          <Button size="sm" disabled={loading} onClick={() => run(cfg.approve!)}>
            {busy === cfg.approve ? <Loader2 className="w-4 h-4 animate-spin" /> : <ApproveIcon />}
            {LABEL[cfg.approve]}
          </Button>
        )}
      </div>
    </div>
  );
}
