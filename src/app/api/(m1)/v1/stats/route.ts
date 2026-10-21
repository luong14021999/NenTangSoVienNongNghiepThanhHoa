import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/platform/data/integration";
import { buildOutboundData } from "@/lib/platform/integration/outbound";

export const dynamic = "force-dynamic";

/** Số liệu tổng hợp theo tháng: ?month=YYYY-MM (mặc định tháng hiện tại). */
export const GET = withApiKey("stats:read", async (req) => {
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (month && !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month phải có dạng YYYY-MM", code: "BAD_REQUEST" }, { status: 400 });
  return NextResponse.json(await buildOutboundData("bao-cao-thong-ke", month));
});
