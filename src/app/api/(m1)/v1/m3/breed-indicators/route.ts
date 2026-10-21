import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/platform/data/integration";
import { breedIndicators } from "@/lib/modules/m3/data/genomics";

export const dynamic = "force-dynamic";

/** Chỉ tiêu về giống (M3.2.7) cho Sở NN&MT, IOC tỉnh – khóa API phạm vi breed:read. ?year=YYYY */
export const GET = withApiKey("breed:read", async (req) => {
  const y = Number(new URL(req.url).searchParams.get("year")) || new Date().getFullYear();
  if (y < 2000 || y > 2100) return NextResponse.json({ error: "year không hợp lệ", code: "BAD_REQUEST" }, { status: 400 });
  const data = await breedIndicators(y);
  if (!data) return NextResponse.json({ error: "Chưa có cơ sở dữ liệu", code: "UNAVAILABLE" }, { status: 503 });
  return NextResponse.json(data);
});
