import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { blastDeleteSequence } from "@/lib/modules/m3/blast-client";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ accession: string }> }) {
  const gate = await authorize("write.breeding");
  if (!gate.ok) return gate.response;
  const accession = decodeURIComponent((await params).accession);
  try {
    await blastDeleteSequence(accession);
  } catch (e) {
    // Trình tự đã không còn trên dịch vụ → vẫn xóa thông tin mô tả.
    if (!/Không có trình tự/.test((e as Error).message)) return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  await dbQuery(`delete from m3_breed.sequence_refs where accession = $1`, [accession]);
  await logChange({ entity: "sequence-refs", entityId: accession, action: "Xoá", label: accession, actor: gate.actor.name });
  return NextResponse.json({ ok: true });
}
