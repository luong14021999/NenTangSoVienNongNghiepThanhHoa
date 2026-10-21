import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/data/integration";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Trạng thái mẫu theo mã (không có thông tin khách hàng / kết quả). */
export const GET = withApiKey<{ code: string }>("samples:status", async (_req, _ctx, { code }) => {
  const [s] = await dbQuery(
    `select code, type, received_at, due_at, status, criteria_count, first_issued_at, on_time from analytics.fact_samples where code = $1`,
    [code],
  );
  if (!s) return NextResponse.json({ error: `Không có mẫu ${code}`, code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({
    code: s.code,
    type: s.type,
    receivedAt: s.received_at,
    dueAt: s.due_at,
    status: s.status,
    criteriaCount: s.criteria_count,
    reportIssuedAt: s.first_issued_at,
    onTime: s.on_time,
  });
});
