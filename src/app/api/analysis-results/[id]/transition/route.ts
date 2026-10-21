import { NextResponse } from "next/server";
import { authorize, requireFreshAuth } from "@/lib/data/access";
import { SIGN_METHOD, contentHash, resultSignedContent } from "@/lib/signature";
import type { Permission } from "@/lib/permissions";
import {
  TRANSITIONS,
  addAudit,
  getResult,
  nowVN,
  updateResult,
  type TransitionAction,
} from "@/lib/data/results";
import { loadReleaseContext } from "@/lib/data/release-rules";
import { blockers, warnings } from "@/lib/release-checks";

export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = {
  "KTV nhập": "Kỹ thuật viên",
  "QA/QC kiểm tra": "QA/QC",
  "Trưởng phòng duyệt": "Trưởng phòng / người được ủy quyền phê duyệt",
};

/**
 * Luồng duyệt 3 cấp: KTV nộp → QA/QC duyệt / trả lại → Trưởng phòng phê duyệt / trả lại.
 * Người duyệt (QA/QC, Trưởng phòng) phải khác người đã nhập kết quả.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, comment = "" } = (await req.json()) as { action: TransitionAction; comment?: string };
  const t = TRANSITIONS[action];
  if (!t) return NextResponse.json({ error: "Thao tác không hợp lệ" }, { status: 400 });
  const perm: Permission = action === "submit" ? "results.enter" : action.startsWith("qa_") ? "results.qa" : "results.approve";
  const gate = await authorize(perm);
  if (!gate.ok) return gate.response;
  const actor = gate.actor;
  // Phê duyệt = ký điện tử → phải vừa xác thực lại bằng mật khẩu.
  if (action === "manager_approve") {
    const reauth = await requireFreshAuth();
    if (reauth) return reauth;
  }

  const current = await getResult(id);
  if (!current) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (!(t.from as readonly string[]).includes(current.status)) {
    return NextResponse.json({ error: `Không thể "${t.label}" khi kết quả đang "${current.status}"` }, { status: 409 });
  }
  if (t.decision === "Trả lại sửa" && !comment.trim()) {
    return NextResponse.json({ error: "Trả lại cần ghi lý do" }, { status: 400 });
  }
  if (action !== "submit" && actor.name === current.technician) {
    return NextResponse.json({ error: "Người duyệt phải khác người đã nhập kết quả" }, { status: 403 });
  }

  // Kiểm soát trước phát hành (M2.5): chặn khi nộp, khi QA/QC duyệt và khi Trưởng phòng phê duyệt.
  let checkNote = "";
  if (action === "submit" || action === "qa_approve" || action === "manager_approve") {
    const { evaluate, version } = await loadReleaseContext();
    const checks = evaluate(current, action === "manager_approve" ? actor.name : undefined);
    const blocked = blockers(checks);
    if (blocked.length) {
      return NextResponse.json(
        {
          error: `Bị chặn bởi quy tắc kiểm soát (phiên bản ${version}): ${blocked.map((c) => c.message).join("; ")}`,
          checks: blocked,
        },
        { status: 409 },
      );
    }
    const warn = warnings(checks);
    checkNote = `Kiểm soát v${version}: ${checks.filter((c) => c.status === "Đạt").length} đạt${warn.length ? `, ${warn.length} cảnh báo (${warn.map((c) => c.message).join("; ")})` : ""}`;
  }

  const signedAt = nowVN();
  let approvals = current.approvals.length ? [...current.approvals] : [];
  // Nộp lại sau khi bị trả: làm mới các bước duyệt phía sau.
  if (action === "submit") {
    approvals = approvals.map((a) => (a.step === "KTV nhập" ? a : { step: a.step, actor: "—", role: "—", decision: "Chờ" as const }));
  }
  const record = {
    step: t.step,
    actor: actor.name,
    role: ROLE[t.step],
    decision: t.decision,
    comment: comment.trim() || undefined,
    signedAt,
    ...(action === "manager_approve" ? { signatureHash: contentHash(resultSignedContent(current)) } : {}),
  };
  const idx = approvals.findIndex((a) => a.step === t.step);
  if (idx >= 0) approvals[idx] = record;
  else approvals.push(record);

  const patch: Record<string, unknown> = { status: t.to, approvals };
  if (action.startsWith("qa_")) patch.qa_comment = comment.trim() || null;
  if (action.startsWith("manager_")) patch.manager_comment = comment.trim() || null;
  if (action === "manager_approve") patch.finished_at = new Date().toISOString();

  const item = await updateResult(id, patch);
  await addAudit(id, {
    actor: actor.name,
    action: t.label,
    detail: [
      comment.trim(),
      checkNote,
      action === "manager_approve" ? `Ký điện tử (${SIGN_METHOD}) · SHA-256 ${record.signatureHash?.slice(0, 16)}…` : "",
    ].filter(Boolean).join(" · ") || undefined,
    field: "Trạng thái",
    oldValue: current.status,
    newValue: t.to,
  });
  return NextResponse.json({ ok: true, item });
}
