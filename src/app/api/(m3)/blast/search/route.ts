import { NextResponse } from "next/server";
import { authorize } from "@/lib/platform/data/access";
import { blastSearch } from "@/lib/modules/m3/blast-client";
import { saveBlastSearch } from "@/lib/modules/m3/data/genomics";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Đối soát trình tự trên dịch vụ BLAST nội bộ; lưu nhãn, độ dài, mã băm truy vấn và bảng hit – không lưu trình tự. */
export async function POST(req: Request) {
  const gate = await authorize("write.breeding");
  if (!gate.ok) return gate.response;
  if (Number(req.headers.get("content-length") ?? 0) > 2_100_000) return NextResponse.json({ error: "Dữ liệu quá lớn (tối đa 2 MB)" }, { status: 413 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const program = b.program === "blastp" ? "blastp" : "blastn";
  const evalue = Number(b.evalue) > 0 ? Number(b.evalue) : 1e-5;
  const code = `BL-${todayISO().slice(0, 4)}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const label = String(b.label ?? "").slice(0, 200);
  try {
    const r = await blastSearch({ program, query: String(b.query ?? ""), evalue, maxHits: Number(b.maxHits) || 20 });
    await saveBlastSearch({ code, program, queryLabel: label, queryLength: r.queryLength, querySha256: r.querySha256 ?? "", evalue, hits: r.hits, status: "Hoàn thành", error: "", actor: gate.actor.name });
    return NextResponse.json({ ok: true, code, ...r });
  } catch (e) {
    const msg = (e as Error).message;
    await saveBlastSearch({ code, program, queryLabel: label, queryLength: 0, querySha256: "", evalue, hits: [], status: "Lỗi", error: msg.slice(0, 500), actor: gate.actor.name }).catch(() => {});
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
