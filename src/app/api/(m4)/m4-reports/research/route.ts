import { NextResponse } from "next/server";
import { researchStats } from "@/lib/modules/m4/data/research-stats";
import { csvRow } from "@/lib/modules/m4/finance";
import { currentActor } from "@/lib/platform/auth/server";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

/** Thống kê KH&CN năm dạng CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). */
export async function GET(req: Request) {
  if (!(await currentActor())) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const thisYear = Number(todayISO().slice(0, 4));
  const year = Math.min(thisYear + 1, Math.max(2015, Number(new URL(req.url).searchParams.get("year")) || thisYear));
  const s = await researchStats(year);
  const section = (title: string, rows: { label: string; n?: number; amount?: number }[], col: string) => [
    "",
    csvRow([title, col]),
    ...rows.map((r) => csvRow([r.label, r.n ?? r.amount ?? 0])),
  ];
  const lines = [
    csvRow([`Thống kê KH&CN năm ${year} – Viện Nông nghiệp tỉnh Thanh Hóa`]),
    "",
    csvRow(["Chỉ tiêu", "Giá trị"]),
    csvRow(["Nhiệm vụ thực hiện trong năm", s.totals.tasksInYear]),
    csvRow(["Nhiệm vụ đang triển khai", s.totals.active]),
    csvRow(["Nhiệm vụ phê duyệt mới", s.totals.approvedInYear]),
    csvRow(["Nhiệm vụ nghiệm thu", s.totals.acceptedInYear]),
    csvRow(["Kinh phí phê duyệt mới (VND)", s.totals.budgetApprovedInYear]),
    csvRow(["– trong đó ngân sách nhà nước (VND)", s.totals.stateBudgetApprovedInYear]),
    csvRow(["Giải ngân trong năm (VND)", s.totals.spentInYear]),
    csvRow(["Nhân lực nghiên cứu", s.totals.researchers]),
    csvRow(["Thí nghiệm đồng ruộng bắt đầu trong năm", s.totals.fieldTrialsInYear]),
    ...section("Theo cấp quản lý", s.byLevel, "Số nhiệm vụ"),
    ...section("Theo lĩnh vực", s.byField, "Số nhiệm vụ"),
    ...section("Kết quả nghiệm thu", s.byAcceptance, "Số nhiệm vụ"),
    ...section("Nhân lực theo học vị", s.byDegree, "Số người"),
    ...section("Giải ngân theo nội dung chi", s.spentByCategory, "VND"),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="thong-ke-khcn-${year}.csv"` },
  });
}
