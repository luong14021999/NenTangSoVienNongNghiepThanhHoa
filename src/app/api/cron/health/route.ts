import { NextResponse } from "next/server";
import { getSetting } from "@/lib/data/settings";
import { pruneLogs, runHealthCheck } from "@/lib/data/system";

export const dynamic = "force-dynamic";

/** Tác vụ định kỳ (Vercel Cron): kiểm tra sức khỏe + dọn nhật ký cũ. Xác thực bằng CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  }
  const health = await runHealthCheck("Tự động (cron)");
  const pruned = await pruneLogs(await getSetting("backup_retention_days"));
  return NextResponse.json({ ...health, pruned });
}
