// Xác nhận giá trị sử dụng (§7.11.2): thống kê sản lượng, thời gian trả kết quả, doanh thu (M2.7).
import { describe, expect, it } from "vitest";
import { countByMonth, lastMonths, median, monthKey, requestValue, turnaroundDays } from "./stats";

describe("Thống kê", () => {
  it("TC-SA-01 tháng theo giờ Việt Nam (23:30 UTC ngày 31 → tháng sau)", () => {
    expect(monthKey("2026-05-31T23:30:00Z")).toBe("2026-06");
    expect(monthKey("2026-05-31T10:00:00Z")).toBe("2026-05");
    expect(lastMonths("2026-02-15", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
  it("TC-SA-02 thời gian trả kết quả = ngày phát hành − ngày nhận (ngày lịch, giờ VN)", () => {
    // 18/5 21:30 giờ VN → 25/5 09:00 giờ VN = 7 ngày lịch (không phải 6,5 ngày theo giờ)
    expect(turnaroundDays("2026-05-18T14:30:00Z", "2026-05-25T02:00:00Z")).toBe(7);
    // 23:00 UTC 31/5 là 06:00 VN 1/6 → cùng ngày phát hành 1/6 = 0 ngày
    expect(turnaroundDays("2026-05-31T23:00:00Z", "2026-06-01T03:00:00Z")).toBe(0);
  });
  it("TC-SA-03 trung vị, đếm theo tháng", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNaN();
    expect(countByMonth(["2026-01-05T00:00:00Z", "2026-01-20T00:00:00Z", "2026-02-01T00:00:00Z", "2025-01-01T00:00:00Z"], ["2026-01", "2026-02"])).toEqual([2, 1]);
  });
  it("TC-SA-04 giá trị phiếu yêu cầu: Σ đơn giá × số mẫu + VAT", () => {
    expect(requestValue([{ unitPrice: 120000 }, { unitPrice: 80000 }], 3, 8)).toEqual({ net: 600000, vat: 48000, total: 648000 });
    expect(requestValue([{}], 2, 0)).toEqual({ net: 0, vat: 0, total: 0 });
  });
});
