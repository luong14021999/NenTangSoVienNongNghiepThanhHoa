import { NextResponse } from "next/server";
import { currentActor } from "@/lib/auth/server";
import {
  addAudit,
  initialApprovals,
  insertResult,
  listResults,
  nextResultCode,
} from "@/lib/data/results";
import { buildResultColumns, validateInput, type ResultInput } from "@/lib/data/result-input";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listResults();
  return NextResponse.json({ count: items.length, items });
}

/** KTV tạo kết quả: tự tính thống kê, áp quy tắc quyết định, ghi lưu vết. */
export async function POST(req: Request) {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const body = (await req.json()) as ResultInput;
  const err = validateInput(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const cols = await buildResultColumns(body);
  const created = await insertResult({
    ...cols,
    result_code: await nextResultCode(todayISO().slice(0, 4)),
    technician: actor.name,
    started_at: new Date().toISOString(),
    status: "Đang nhập",
    approvals: initialApprovals(),
    raw_files: [],
  });
  await addAudit(created.id, {
    actor: actor.name,
    action: "Tạo kết quả",
    detail: `${created.criterion} · mẫu ${created.sampleCode} · x̄ = ${created.mean} ${created.unit} · ${created.conclusion}`,
  });
  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
