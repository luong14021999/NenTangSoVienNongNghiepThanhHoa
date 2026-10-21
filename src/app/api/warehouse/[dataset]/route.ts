import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/data/access";
import { DATASETS, datasetRows, isDataset, toCsv } from "@/lib/data/system";

export const dynamic = "force-dynamic";

/** Xuất tập dữ liệu kho dữ liệu: ?format=csv (mặc định) hoặc json. */
export async function GET(req: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const { actor } = await currentAccess();
  if (!actor) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const d = (await params).dataset;
  if (!isDataset(d)) return NextResponse.json({ error: "Không có tập dữ liệu này" }, { status: 404 });
  const rows = await datasetRows(d);
  if (new URL(req.url).searchParams.get("format") === "json") return NextResponse.json({ dataset: d, name: DATASETS[d].name, count: rows.length, rows });
  return new Response(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${d}.csv"` },
  });
}
