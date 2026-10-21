import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { logChange } from "@/lib/platform/data/change-log";
import { blastAddSequence } from "@/lib/modules/m3/blast-client";
import { upsertSequenceRef } from "@/lib/modules/m3/data/genomics";

export const dynamic = "force-dynamic";

/** Gửi trình tự tới dịch vụ BLAST nội bộ; nền tảng chỉ lưu thông tin mô tả (độ dài, mã băm) – không lưu trình tự. */
export async function POST(req: Request) {
  const gate = await authorize("write.breeding");
  if (!gate.ok) return gate.response;
  if (Number(req.headers.get("content-length") ?? 0) > 2_100_000) return NextResponse.json({ error: "Dữ liệu quá lớn (tối đa 2 MB)" }, { status: 413 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const accession = String(b.accession ?? "").trim();
  const molecule = ["ADN", "ARN", "Protein"].includes(b.molecule) ? b.molecule : "ADN";
  try {
    const r = await blastAddSequence({ accession, molecule, sequence: String(b.sequence ?? "") });
    await upsertSequenceRef({ accession: r.accession, molecule, gene: String(b.gene ?? ""), varietyId: String(b.varietyId ?? ""), germplasmId: String(b.germplasmId ?? ""), length: r.length, checksum: r.sha256, note: String(b.note ?? "") });
    await logChange({ entity: "sequence-refs", entityId: r.accession, action: "Thêm", label: `${r.accession} (${r.length} ${molecule === "Protein" ? "aa" : "bp"})`, actor: gate.actor.name });
    return NextResponse.json({ ok: true, item: r }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
