import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { upsertGenotypes } from "@/lib/modules/m3/data/genomics";
import { parseGenotypeCsv } from "@/lib/modules/m3/genomics";

export const dynamic = "force-dynamic";

/** Nhập kiểu gen dán từ Excel: lỗi ở dòng nào hoặc mã mẫu / chỉ thị chưa có → không ghi gì. */
export async function POST(req: Request) {
  const gate = await authorize("write.breeding");
  if (!gate.ok) return gate.response;
  const b = (await req.json().catch(() => ({}))) as { csv?: unknown };
  const csv = typeof b.csv === "string" ? b.csv : "";
  if (csv.length > 2_000_000) return NextResponse.json({ error: "Dữ liệu quá lớn (tối đa 2 MB mỗi lần)" }, { status: 413 });
  const { rows, errors } = parseGenotypeCsv(csv);
  if (errors.length) return NextResponse.json({ error: `${errors.length} dòng lỗi – chưa ghi dữ liệu`, errors: errors.slice(0, 20) }, { status: 400 });
  if (!rows.length) return NextResponse.json({ error: "Không có dòng kiểu gen nào" }, { status: 400 });
  const r = await upsertGenotypes(rows);
  if (r.missing.length) return NextResponse.json({ error: `Chưa có trong danh mục: ${r.missing.slice(0, 10).join(", ")}${r.missing.length > 10 ? "…" : ""} – thêm mẫu / chỉ thị trước`, errors: [] }, { status: 400 });
  await logChange({ entity: "genotype-calls", entityId: "import", action: "Nhập CSV", label: `${r.imported} kiểu gen`, actor: gate.actor.name });
  return NextResponse.json({ ok: true, imported: r.imported });
}
