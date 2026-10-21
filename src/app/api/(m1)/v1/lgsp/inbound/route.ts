import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/platform/data/integration";
import { recordInbound } from "@/lib/platform/integration/lgsp";

export const dynamic = "force-dynamic";

/** Điểm nhận thông điệp từ LGSP / NDXP: { header: { maGiaoDich, dichVu, ... }, data }. Trả biên nhận. */
export const POST = withApiKey("lgsp:inbound", async (req, ctx) => {
  const body = (await req.json().catch(() => null)) as { header?: { dichVu?: string; kenh?: string } } | null;
  if (!body || typeof body !== "object" || !body.header?.dichVu) {
    return NextResponse.json({ error: "Thông điệp phải có header.dichVu", code: "BAD_REQUEST" }, { status: 400 });
  }
  const ack = await recordInbound(body.header.kenh === "NDXP" ? "NDXP" : "LGSP", body.header.dichVu, body, ctx.client.name);
  return NextResponse.json(ack, { status: 202 });
});
