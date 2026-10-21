import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/data/integration";
import { getReportByCode, recomputeHash } from "@/lib/data/reports";

export const dynamic = "force-dynamic";

/** Xác minh phiếu kết quả: trạng thái + toàn vẹn (không trả kết quả phân tích). */
export const GET = withApiKey<{ code: string }>("reports:verify", async (_req, _ctx, { code }) => {
  const r = await getReportByCode(code);
  if (!r) return NextResponse.json({ error: `Không có phiếu ${code}`, code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({
    code: r.code,
    sampleCode: r.sampleCode,
    revision: r.revision,
    status: r.status,
    issuedAt: r.issuedAt,
    issuedBy: r.issuedBy,
    revokedAt: r.revokedAt || null,
    contentHash: r.contentHash,
    intact: recomputeHash(r) === r.contentHash,
  });
});
