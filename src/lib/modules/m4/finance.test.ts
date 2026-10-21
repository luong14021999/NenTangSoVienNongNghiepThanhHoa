import { describe, expect, it } from "vitest";
import {
  agingBucket,
  allowedActions,
  contractAlerts,
  csvRow,
  lineAmount,
  linesSummary,
  marginPct,
  nextDocCode,
  nextQuotationStatus,
  quotationLocked,
  sumByMonth,
  unitCostOf,
  vndInWords,
} from "./finance";

describe("định mức & dòng báo giá", () => {
  it("giá thành = tổng 4 khoản định mức", () => {
    expect(unitCostOf({ costMaterials: 120_000, costLabor: 80_000, costDepreciation: 30_000, costOverhead: 20_000 })).toBe(250_000);
  });
  it("tỷ suất lợi nhuận; thiếu giá hoặc định mức → null", () => {
    expect(marginPct(400_000, 250_000)).toBe(37.5);
    expect(marginPct(200_000, 250_000)).toBe(-25);
    expect(marginPct(0, 100)).toBeNull();
    expect(marginPct(100, 0)).toBeNull();
  });
  it("thành tiền dòng sau giảm giá, giảm giá bị chặn 0–100%", () => {
    expect(lineAmount({ quantity: 10, unitPrice: 110_000, discountPct: 10 })).toBe(990_000);
    expect(lineAmount({ quantity: 3, unitPrice: 333_333, discountPct: 0 })).toBe(999_999);
    expect(lineAmount({ quantity: 1, unitPrice: 100, discountPct: 150 })).toBe(0);
  });
  it("cộng dòng: doanh thu, giá thành, tỷ suất", () => {
    const s = linesSummary([
      { quantity: 10, unitPrice: 100_000, discountPct: 0, unitCost: 60_000 },
      { quantity: 2, unitPrice: 500_000, discountPct: 20, unitCost: 300_000 },
    ]);
    expect(s).toEqual({ amount: 1_800_000, cost: 1_200_000, margin: 33.3 });
  });
});

describe("quy trình phê duyệt báo giá", () => {
  const draft = { status: "Nháp", amount: 1_000_000, submittedBy: "" };
  const pending = { status: "Chờ duyệt", amount: 1_000_000, submittedBy: "lap@vnn.vn" };
  const staff = { actorEmail: "lap@vnn.vn", canApprove: false };
  const boss = { actorEmail: "truongphong@vnn.vn", canApprove: true };

  it("trình duyệt cần có giá trị", () => {
    expect(nextQuotationStatus(draft, "submit", staff)).toEqual({ to: "Chờ duyệt" });
    expect(nextQuotationStatus({ ...draft, amount: 0 }, "submit", staff)).toHaveProperty("error");
  });
  it("chỉ người có quyền mới duyệt; người trình không tự duyệt", () => {
    expect(nextQuotationStatus(pending, "approve", staff)).toEqual({ error: "Bạn không có quyền phê duyệt báo giá" });
    expect(nextQuotationStatus(pending, "approve", { actorEmail: "LAP@vnn.vn", canApprove: true })).toEqual({
      error: "Người trình duyệt không được tự duyệt báo giá của mình",
    });
    expect(nextQuotationStatus(pending, "approve", boss)).toEqual({ to: "Đã duyệt" });
  });
  it("không nhảy cóc trạng thái", () => {
    expect(nextQuotationStatus(draft, "send", staff)).toHaveProperty("error");
    expect(nextQuotationStatus(draft, "accept", staff)).toHaveProperty("error");
    expect(nextQuotationStatus(draft, "hack", staff)).toEqual({ error: "Thao tác không hợp lệ" });
  });
  it("các bước được phép theo trạng thái; khóa giá trị từ khi trình", () => {
    expect(allowedActions("Đã gửi")).toEqual(["accept", "decline", "expire"]);
    expect(allowedActions("Được chấp nhận")).toEqual([]);
    expect(quotationLocked("Nháp")).toBe(false);
    expect(quotationLocked("Chờ duyệt")).toBe(true);
  });
});

describe("thời hạn & công nợ", () => {
  it("phân tuổi nợ", () => {
    expect(agingBucket(NaN)).toBe("Trong hạn");
    expect(agingBucket(0)).toBe("Trong hạn");
    expect(agingBucket(1)).toBe("1–30 ngày");
    expect(agingBucket(45)).toBe("31–60 ngày");
    expect(agingBucket(90)).toBe("61–90 ngày");
    expect(agingBucket(91)).toBe("> 90 ngày");
  });
  it("cảnh báo hợp đồng: trễ trả kết quả, quá hạn thanh toán, sắp hết hạn", () => {
    const c = { status: "Đang thực hiện", resultDueAt: "2026-10-15", deliveredAt: "", paymentDueAt: "2026-10-01", endAt: "2026-10-25" };
    expect(contractAlerts(c, 5_000_000, "2026-10-21")).toEqual([
      { kind: "Trễ trả kết quả", days: 6 },
      { kind: "Quá hạn thanh toán", days: 20 },
      { kind: "Sắp hết hạn hợp đồng", days: 4 },
    ]);
    expect(contractAlerts({ ...c, deliveredAt: "2026-10-14" }, 0, "2026-10-21")).toEqual([{ kind: "Sắp hết hạn hợp đồng", days: 4 }]);
    expect(contractAlerts({ ...c, status: "Hủy" }, 5_000_000, "2026-10-21")).toEqual([]);
  });
});

describe("số chứng từ, báo cáo, CSV", () => {
  it("số kế tiếp theo năm, bỏ qua số khác định dạng", () => {
    expect(nextDocCode("HĐ", 2026, ["HĐ-2026-007", "HĐ-2025-099", "HĐ-2026-x"])).toBe("HĐ-2026-008");
    expect(nextDocCode("BG", 2026, [])).toBe("BG-2026-001");
  });
  it("cộng theo tháng", () => {
    const v = sumByMonth([{ d: "2026-01-05", v: 10 }, { d: "2026-01-20", v: 5 }, { d: "2025-12-31", v: 99 }], (x) => x.d, (x) => x.v, ["2026-01", "2026-02"]);
    expect(v).toEqual([15, 0]);
  });
  it("CSV: bọc ngoặc kép, chặn công thức Excel", () => {
    expect(csvRow(['a"b', 12, "=HYPERLINK(1)"])).toBe('"a""b","12","\'=HYPERLINK(1)"');
  });
});

describe("đọc số tiền bằng chữ", () => {
  it.each([
    [0, "Không đồng"],
    [15, "Mười lăm đồng"],
    [21, "Hai mươi mốt đồng"],
    [105, "Một trăm linh năm đồng"],
    [1_250_000, "Một triệu hai trăm năm mươi nghìn đồng"],
    [1_005_000, "Một triệu không trăm linh năm nghìn đồng"],
    [24_000_000, "Hai mươi tư triệu đồng"],
    [5_000_000_005, "Năm tỷ không trăm linh năm đồng"],
    [1_000_000_000_000, "Một nghìn tỷ đồng"],
  ])("%d → %s", (n, words) => {
    expect(vndInWords(n)).toBe(words);
  });
});
