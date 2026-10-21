import { describe, expect, it } from "vitest";
import { agreementExpiryAlert, ipExpiryAlert, parseNumberVi, parseObservationsCsv } from "./knowledge";
import { permissionForEntity, roleAllows } from "@/lib/platform/permissions";

describe("đọc số theo quy ước tệp", () => {
  it("Excel tiếng Việt (; hoặc tab): phẩy thập phân, chấm hàng nghìn", () => {
    expect(parseNumberVi("35,2", true)).toBe(35.2);
    expect(parseNumberVi("1.234,5", true)).toBe(1234.5);
    expect(parseNumberVi("1.234.567", true)).toBe(1234567);
    expect(parseNumberVi("35.2", true)).toBe(35.2); // Excel bản tiếng Anh dán vào
  });
  it("tệp phân cách bằng phẩy: chấm thập phân", () => {
    expect(parseNumberVi("1234.5", false)).toBe(1234.5);
    expect(parseNumberVi("1,234.5", false)).toBe(1234.5);
  });
  it("trống → null; chữ → NaN", () => {
    expect(parseNumberVi(" ", true)).toBeNull();
    expect(parseNumberVi("abc", true)).toBeNaN();
    expect(parseNumberVi("1e5", false)).toBeNaN();
  });
});

describe("nhập CSV số liệu dữ liệu nền", () => {
  it("dán từ Excel (tab), có dòng tiêu đề tiếng Việt", () => {
    const r = parseObservationsCsv("Địa bàn\tKỳ\tChỉ tiêu\tGiá trị\tĐơn vị\nTP Thanh Hóa\t2025-01\tLượng mưa\t35,2\tmm\nSầm Sơn\t2025\tDiện tích lúa\t1.250\tha");
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([
      { location: "TP Thanh Hóa", period: "2025-01", indicator: "Lượng mưa", value: 35.2, unit: "mm" },
      { location: "Sầm Sơn", period: "2025", indicator: "Diện tích lúa", value: 1250, unit: "ha" },
    ]);
  });
  it("CSV phẩy, ô có ngoặc kép, giá trị trống", () => {
    const r = parseObservationsCsv('location,period,indicator,value,unit\n"Huyện A, xã B",2024-12,Nhiệt độ,18.5,°C\nHuyện C,2024-12,Nhiệt độ,,°C');
    expect(r.errors).toEqual([]);
    expect(r.rows[0]).toMatchObject({ location: "Huyện A, xã B", value: 18.5 });
    expect(r.rows[1].value).toBeNull();
  });
  it("báo lỗi theo số dòng: kỳ sai, thiếu chỉ tiêu, giá trị không phải số", () => {
    const r = parseObservationsCsv("A;2025-13;Mưa;1;mm\nB;2025;;1;mm\nC;2025;Mưa;nhiều;mm\nD;2025;Mưa;2;mm");
    expect(r.errors.map((e) => e.line)).toEqual([1, 2, 3]);
    expect(r.rows).toHaveLength(1);
  });
  it("giới hạn số dòng", () => {
    const r = parseObservationsCsv("A,2025,X,1,\nB,2025,X,2,\nC,2025,X,3,", 2);
    expect(r.rows).toHaveLength(2);
    expect(r.errors[0].message).toMatch(/Quá 2 dòng/);
  });
});

describe("cảnh báo văn bằng & thỏa thuận", () => {
  it("văn bằng được cấp sắp / đã hết hiệu lực", () => {
    expect(ipExpiryAlert({ status: "Được cấp bằng", expiresAt: "2027-01-01" }, "2026-10-21")).toEqual({ kind: "Văn bằng sắp hết hiệu lực", days: 72 });
    expect(ipExpiryAlert({ status: "Được cấp bằng", expiresAt: "2026-10-01" }, "2026-10-21")).toEqual({ kind: "Văn bằng đã hết hiệu lực", days: 20 });
    expect(ipExpiryAlert({ status: "Được cấp bằng", expiresAt: "2035-01-01" }, "2026-10-21")).toBeNull();
    expect(ipExpiryAlert({ status: "Đã nộp đơn", expiresAt: "2026-10-01" }, "2026-10-21")).toBeNull();
  });
  it("thỏa thuận đang hiệu lực sắp hết hạn", () => {
    expect(agreementExpiryAlert({ status: "Đang hiệu lực", validUntil: "2026-11-30" }, "2026-10-21")).toEqual({ kind: "Thỏa thuận sắp hết hạn", days: 40 });
    expect(agreementExpiryAlert({ status: "Hết hạn", validUntil: "2026-01-01" }, "2026-10-21")).toBeNull();
  });
  it("phân quyền kho tri thức, sở hữu trí tuệ", () => {
    expect(permissionForEntity("knowledge-items")).toBe("write.research");
    expect(permissionForEntity("ip-assets")).toBe("write.research");
    expect(roleAllows(["Quản lý khoa học"], "write.research")).toBe(true);
    expect(roleAllows(["KTV"], "write.research")).toBe(false);
  });
});
