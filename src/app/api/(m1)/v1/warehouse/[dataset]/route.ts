import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/platform/data/integration";
import { dbQuery, ident } from "@/lib/platform/db";
import { DATASETS, isDataset } from "@/lib/platform/data/system";

export const dynamic = "force-dynamic";

/** Đọc tập dữ liệu kho dữ liệu, phân trang ?limit=(1–1000, mặc định 100)&offset=. */
export const GET = withApiKey<{ dataset: string }>("warehouse:read", async (req, _ctx, { dataset }) => {
  if (!isDataset(dataset)) return NextResponse.json({ error: "Không có tập dữ liệu này", code: "NOT_FOUND", available: Object.keys(DATASETS) }, { status: 404 });
  const sp = new URL(req.url).searchParams;
  const limit = Math.min(1000, Math.max(1, Number(sp.get("limit")) || 100));
  const offset = Math.max(0, Number(sp.get("offset")) || 0);
  const [{ n }] = await dbQuery(`select count(*)::int n from analytics.${ident(dataset)}`);
  const rows = await dbQuery(`select * from analytics.${ident(dataset)} limit $1 offset $2`, [limit, offset]);
  return NextResponse.json({ dataset, name: DATASETS[dataset].name, total: Number(n), limit, offset, rows });
});
