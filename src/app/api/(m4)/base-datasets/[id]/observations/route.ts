import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { baseDatasetStore, upsertObservations } from "@/lib/modules/m4/data/knowledge";
import { parseObservationsCsv } from "@/lib/modules/m4/knowledge";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

const dataset = async (id: string) => (await baseDatasetStore.list()).find((d) => d.id === id);

/** Nhập số liệu từ CSV (dán từ Excel). Lỗi ở bất kỳ dòng nào → không ghi gì, trả danh sách lỗi. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.research");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const d = await dataset(id);
  if (!d) return NextResponse.json({ error: "Không tìm thấy bộ dữ liệu" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { csv?: unknown };
  const csv = typeof b.csv === "string" ? b.csv : "";
  if (csv.length > 1_000_000) return NextResponse.json({ error: "Dữ liệu quá lớn (tối đa 1 MB mỗi lần)" }, { status: 413 });
  const { rows, errors } = parseObservationsCsv(csv);
  if (errors.length) {
    return NextResponse.json({ error: `${errors.length} dòng lỗi – chưa ghi dữ liệu`, errors: errors.slice(0, 20) }, { status: 400 });
  }
  if (!rows.length) return NextResponse.json({ error: "Không có dòng số liệu nào" }, { status: 400 });
  const n = await upsertObservations(id, rows);
  await logChange({ entity: "base-observations", entityId: id, action: "Nhập CSV", label: `${d.code}: ${n} dòng`, actor: gate.actor.name });
  return NextResponse.json({ ok: true, imported: n });
}

/** Xóa toàn bộ số liệu của bộ dữ liệu (để nhập lại). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await authorize("write.research");
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const d = await dataset(id);
  if (!d) return NextResponse.json({ error: "Không tìm thấy bộ dữ liệu" }, { status: 404 });
  const rows = await dbQuery(`delete from m4.base_observations where dataset_id = $1 returning id`, [id]);
  await logChange({ entity: "base-observations", entityId: id, action: "Xoá", label: `${d.code}: ${rows.length} dòng`, actor: gate.actor.name });
  return NextResponse.json({ ok: true, deleted: rows.length });
}
