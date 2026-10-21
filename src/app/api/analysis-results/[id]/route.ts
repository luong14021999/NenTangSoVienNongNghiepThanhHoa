import { NextResponse } from "next/server";
import { EDITABLE, addAudit, deleteResult, getResult, saveRawFile, updateResult } from "@/lib/data/results";
import { AUDITED, buildResultColumns, validateInput, type ResultInput } from "@/lib/data/result-input";
import { loadReleaseContext } from "@/lib/data/release-rules";
import { authorize } from "@/lib/data/access";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const show = (v: unknown) =>
  Array.isArray(v) ? v.map((x) => (x as { value: number }).value).join("; ") : v === null || v === undefined ? "" : String(v);

/** Sửa kết quả (chỉ khi Đang nhập / Trả lại sửa) – mỗi trường thay đổi ghi 1 dòng lưu vết. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const actor = gate.actor;
  const current = await getResult(id);
  if (!current) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (!EDITABLE.includes(current.status)) {
    return NextResponse.json({ error: `Kết quả đang "${current.status}" – đã khóa, không sửa được` }, { status: 409 });
  }
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
  const before: Record<string, unknown> = {
    sample_code: current.sampleCode,
    criterion: current.criterion,
    unit: current.unit,
    instrument_code: current.instrument.code,
    reference_material: current.referenceMaterial,
    replicates: current.replicates,
    mean: Number.isFinite(current.mean) ? current.mean : null,
    uncertainty: Number.isFinite(current.uncertainty) ? current.uncertainty : null,
    matrix_spike_recovery: Number.isFinite(current.matrixSpikeRecovery) ? current.matrixSpikeRecovery : null,
    blank_value: Number.isFinite(current.blankBlankValue) ? current.blankBlankValue : null,
    decision_rule_type: current.decisionRuleType,
    conclusion: current.conclusion,
    readings: current.calcDetail?.readings ?? current.replicates.map((r) => r.value),
    calc_template: current.calcDetail?.template ? `${current.calcDetail.template.code} ${JSON.stringify(current.calcDetail.template.variables)}` : "",
    calc_curve: current.calcDetail?.curve?.code ?? "",
    uncertainty_budget: current.uncertaintyDetail?.budgetCode ?? "",
  };
  const after: Record<string, unknown> = {
    ...cols,
    readings: cols.calc_detail.readings,
    calc_template: cols.calc_detail.template ? `${cols.calc_detail.template.code} ${JSON.stringify(cols.calc_detail.template.variables)}` : "",
    calc_curve: cols.calc_detail.curve?.code ?? "",
    uncertainty_budget: cols.uncertainty_detail?.budgetCode ?? "",
  };
  const changes = Object.keys(AUDITED).filter((k) => show(before[k]) !== show(after[k]));
  const raw = body.rawFile?.content ? await saveRawFile(id, body.rawFile, actor.name) : null;
  if (raw) await addAudit(id, { actor: actor.name, action: "Đính kèm file dữ liệu thô", detail: `${body.rawFile!.name} · SHA-256 ${raw.sha256}` });
  if (changes.length === 0) return NextResponse.json({ ok: true, item: current });

  const item = await updateResult(id, cols);
  for (const k of changes) {
    await addAudit(id, {
      actor: actor.name,
      action: "Sửa kết quả",
      field: AUDITED[k],
      oldValue: show(before[k]),
      newValue: show(after[k]),
    });
  }
  return NextResponse.json({ ok: true, item });
}

/** Chỉ xoá được kết quả chưa từng nộp – hồ sơ đã nộp/duyệt phải được giữ (§8.4). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const gate = await authorize("results.enter");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const current = await getResult(id);
  if (!current) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  const submitted = current.approvals.some((a) => a.decision !== "Chờ");
  if (current.status !== "Đang nhập" || submitted) {
    return NextResponse.json({ error: "Kết quả đã nộp duyệt – không được xoá, chỉ được trả lại sửa" }, { status: 409 });
  }
  return (await deleteResult(id))
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
}
