import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/platform/data/integration";
import { listCatalogs, listItems } from "@/lib/platform/data/mdm";

export const dynamic = "force-dynamic";

export const GET = withApiKey<{ code: string }>("catalogs:read", async (req, _ctx, { code }) => {
  if (!(await listCatalogs()).some((c) => c.code === code)) return NextResponse.json({ error: `Không có danh mục ${code}`, code: "NOT_FOUND" }, { status: 404 });
  const all = new URL(req.url).searchParams.get("includeInactive") === "true";
  const items = (await listItems(code, { activeOnly: !all })).map(({ code, name, nameEn, parentCode, attrs, status, version, validFrom, updatedAt }) => ({ code, name, nameEn, parentCode, attrs, status, version, validFrom, updatedAt }));
  return NextResponse.json({ catalog: code, count: items.length, items });
});
