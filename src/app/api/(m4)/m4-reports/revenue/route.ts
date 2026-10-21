import { NextResponse } from "next/server";
import { revenueReport } from "@/lib/modules/m4/data/revenue";
import { csvRow } from "@/lib/modules/m4/finance";
import { currentActor } from "@/lib/platform/auth/server";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Báo cáo doanh thu năm dạng CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). */
export async function GET(req: Request) {
  if (!(await currentActor())) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const thisYear = Number(todayISO().slice(0, 4));
  const year = Math.min(thisYear + 1, Math.max(2020, Number(new URL(req.url).searchParams.get("year")) || thisYear));
  const r = await revenueReport(year);
  const lines = [
    csvRow([`Báo cáo doanh thu dịch vụ năm ${year} – Viện Nông nghiệp tỉnh Thanh Hóa`]),
    "",
    csvRow(["Tháng", "Giá trị ký kết (VND, sau thuế)", "Đã thu (VND)"]),
    ...r.byMonth.months.map((m, i) => csvRow([m, r.byMonth.contracted[i], r.byMonth.collected[i]])),
    csvRow(["Cộng", r.totals.contracted, r.totals.collected]),
    "",
    csvRow(["Nhóm dịch vụ", "Doanh thu chưa thuế (VND)", "Giá thành định mức (VND)", "Tỷ suất lợi nhuận (%)"]),
    ...r.byCategory.map((c) => csvRow([c.category, c.revenue, c.cost, c.margin ?? ""])),
    "",
    csvRow(["Khách hàng", "Loại", "Ký kết (VND)", "Đã thu (VND)"]),
    ...r.byCustomer.map((c) => csvRow([c.name, c.kind, c.contracted, c.collected])),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="doanh-thu-${year}.csv"`,
    },
  });
}
