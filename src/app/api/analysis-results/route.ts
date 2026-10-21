import { NextResponse } from "next/server";
import {
  addAudit,
  initialApprovals,
  insertResult,
  listResults,
  nextResultCode,
  saveRawFile,
} from "@/lib/data/results";
import { buildResultColumns, validateInput, type ResultInput } from "@/lib/data/result-input";
import { todayISO } from "@/lib/dates";
import { loadReleaseContext } from "@/lib/data/release-rules";
import { authorize } from "@/lib/data/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listResults();
  return NextResponse.json({ count: items.length, items });
}

/** KTV tạo kết quả: tự tính thống kê, áp quy tắc quyết định, ghi lưu vết. */
export async function POST(req: Request) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const actor = gate.actor;
  const body = (await req.json()) as ResultInput;
  const err = validateInput(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { lockedEquipment } = await loadReleaseContext();
  if (body.instrumentCode && lockedEquipment.has(body.instrumentCode)) {
    return NextResponse.json(
      { error: `Thiết bị ${body.instrumentCode} đang bị khóa (quá hạn hiệu chuẩn hoặc không ở trạng thái Hoạt động)` },
      { status: 409 },
    );
  }

  let cols: Awaited<ReturnType<typeof buildResultColumns>>;
  try {
    cols = await buildResultColumns(body);
  } catch (e) {
    return NextResponse.json({ error: `Không tính được kết quả: ${(e as Error).message}` }, { status: 400 });
  }
  const created = await insertResult({
    ...cols,
    result_code: await nextResultCode(todayISO().slice(0, 4)),
    technician: actor.name,
    started_at: new Date().toISOString(),
    status: "Đang nhập",
    approvals: initialApprovals(),
    raw_files: [],
  });
  const raw = body.rawFile?.content ? await saveRawFile(created.id, body.rawFile, actor.name) : null;
  await addAudit(created.id, {
    actor: actor.name,
    action: "Tạo kết quả",
    detail: `${created.criterion} · mẫu ${created.sampleCode} · x̄ = ${created.mean} ${created.unit} · ${created.conclusion}${cols.calc_detail?.template ? ` · công thức ${cols.calc_detail.template.code}` : ""}${cols.calc_detail?.curve ? ` · đường chuẩn ${cols.calc_detail.curve.code}` : ""}${raw ? ` · file thô ${body.rawFile!.name} (SHA-256 ${raw.sha256.slice(0, 12)}…)` : ""}`,
  });
  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
