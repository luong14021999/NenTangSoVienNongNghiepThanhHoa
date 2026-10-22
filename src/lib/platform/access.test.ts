// Xác nhận giá trị sử dụng (§7.11.2): phân quyền (§7.11.3) và chữ ký điện tử (M2.6).
import { describe, expect, it } from "vitest";
import { PERMISSIONS, isConsoleOnly, permissionForEntity, roleAllows, validateBootstrap } from "./permissions";
import { contentHash, reportSignedContent, resultSignedContent } from "./signature";

describe("Phân quyền theo vai trò", () => {
  it("TC-AU-01 tách nhiệm vụ: KTV nhập, QA/QC duyệt, chỉ Trưởng phòng phê duyệt & thu hồi", () => {
    expect(roleAllows(["KTV"], "results.enter")).toBe(true);
    expect(roleAllows(["KTV"], "results.qa")).toBe(false);
    expect(roleAllows(["KTV"], "results.approve")).toBe(false);
    expect(roleAllows(["QA/QC"], "results.qa")).toBe(true);
    expect(roleAllows(["QA/QC"], "results.approve")).toBe(false);
    expect(roleAllows(["Trưởng phòng"], "results.approve")).toBe(true);
    expect(roleAllows(["QA/QC"], "reports.revoke")).toBe(false);
    expect(roleAllows(["Trưởng phòng"], "reports.revoke")).toBe(true);
  });
  it("TC-AU-02 Quản trị hệ thống không duyệt / phát hành kết quả; Chỉ xem không ghi được gì", () => {
    expect(roleAllows(["Quản trị"], "admin.users")).toBe(true);
    expect(roleAllows(["Quản trị"], "results.approve")).toBe(false);
    expect(roleAllows(["Quản trị"], "reports.issue")).toBe(false);
    for (const p of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(roleAllows(["Chỉ xem"], p)).toBe(false);
    }
  });
  it("TC-AU-03 quyền ghi theo module: nhân sự & ủy quyền chỉ Trưởng phòng / Quản trị; ai cũng ghi được sự không phù hợp", () => {
    expect(permissionForEntity("test-authorizations")).toBe("write.personnel");
    expect(roleAllows(["KTV"], permissionForEntity("test-authorizations"))).toBe(false);
    expect(roleAllows(["Tiếp nhận mẫu"], permissionForEntity("samples"))).toBe(true);
    expect(roleAllows(["Tiếp nhận mẫu"], permissionForEntity("equipment"))).toBe(false);
    expect(roleAllows(["Tiếp nhận mẫu"], permissionForEntity("nonconformities"))).toBe(true);
    expect(permissionForEntity("module-moi")).toBe("write.lab");
    expect(roleAllows(["KTV"], permissionForEntity("assignments"))).toBe(false); // KTV không tự phân công
    expect(roleAllows(["QA/QC"], permissionForEntity("assignments"))).toBe(true);
    expect(roleAllows(["Tiếp nhận mẫu"], permissionForEntity("sample-events"))).toBe(true);
  });
  it("TC-AU-05 khu Quản trị cho Quản trị và Lãnh đạo Viện (chỉ xem); Điều hành chỉ Lãnh đạo Viện; đầu mối danh mục chỉ sửa danh mục", () => {
    expect(roleAllows(["Quản trị"], "admin.view")).toBe(true);
    expect(roleAllows(["Lãnh đạo Viện"], "admin.view")).toBe(true);
    for (const r of ["Trưởng phòng", "Quản lý danh mục", "QA/QC", "KTV"]) expect(roleAllows([r], "admin.view")).toBe(false);
    expect(roleAllows(["Lãnh đạo Viện"], "view.executive")).toBe(true);
    for (const r of ["Trưởng phòng", "Quản trị", "KTV"]) expect(roleAllows([r], "view.executive")).toBe(false);
    // Lãnh đạo chỉ xem: không sửa cấu hình, phân quyền, không ghi dữ liệu nghiệp vụ nào
    for (const p of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) if (p !== "view.executive" && p !== "admin.view") expect(roleAllows(["Lãnh đạo Viện"], p)).toBe(false);
    expect(isConsoleOnly(["Lãnh đạo Viện"])).toBe(true);
    expect(isConsoleOnly(["Quản trị"])).toBe(true);
    expect(isConsoleOnly(["Quản trị", "Lãnh đạo Viện"])).toBe(true);
    expect(isConsoleOnly(["Lãnh đạo Viện", "Trưởng phòng"])).toBe(false);
    expect(isConsoleOnly(["Trưởng phòng"])).toBe(false);
    expect(isConsoleOnly([])).toBe(false); // chưa bật phân quyền → không chuyển hướng
    expect(roleAllows(["Quản lý danh mục"], "write.mdm")).toBe(true);
    for (const p of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) if (p !== "write.mdm") expect(roleAllows(["Quản lý danh mục"], p)).toBe(false);
  });
  it("TC-AU-04 bật phân quyền lần đầu phải gán Quản trị cho chính mình (chống tự khoá)", () => {
    expect(validateBootstrap([{ email: "a@x.vn", roles: ["Quản trị"] }], "A@x.vn")).toBeNull();
    expect(validateBootstrap([{ email: "a@x.vn", roles: ["KTV"] }], "a@x.vn")).not.toBeNull();
    expect(validateBootstrap([{ email: "b@x.vn", roles: ["Quản trị"] }], "a@x.vn")).not.toBeNull();
  });
});

describe("Chữ ký điện tử – mã băm SHA-256", () => {
  const report = { code: "PKQ-1", sampleCode: "M-1", revision: 0, replacesCode: "", note: "", snapshot: { lines: [{ resultCode: "KQ-1", mean: 0.237 }] } };
  it("TC-SG-01 cùng nội dung → cùng mã băm, không phụ thuộc thứ tự khoá", () => {
    const a = contentHash(reportSignedContent(report));
    const b = contentHash(reportSignedContent({ ...report, snapshot: { lines: [{ mean: 0.237, resultCode: "KQ-1" }] } }));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  it("TC-SG-02 sửa 1 giá trị kết quả sau khi ký → mã băm khác (phát hiện chỉnh sửa)", () => {
    const signed = contentHash(reportSignedContent(report));
    const tampered = contentHash(reportSignedContent({ ...report, snapshot: { lines: [{ resultCode: "KQ-1", mean: 0.238 }] } }));
    expect(tampered).not.toBe(signed);
  });
  it("TC-SG-03 mã băm kết quả gồm giá trị đo, U, kết luận", () => {
    const base = { resultCode: "KQ-1", sampleCode: "M-1", criterion: "#12 Pb", method: "TCVN", unit: "mg/kg", replicates: [{ id: 1, value: 1 }], mean: 1, sd: 0, rsd: 0, uncertainty: 0.1, conclusion: "Đạt", decisionRuleType: "Guarded acceptance (w = U)" };
    const h = contentHash(resultSignedContent(base));
    expect(contentHash(resultSignedContent({ ...base, conclusion: "Không đạt" }))).not.toBe(h);
    expect(contentHash(resultSignedContent({ ...base, uncertainty: 0.2 }))).not.toBe(h);
    expect(contentHash(resultSignedContent({ ...base, uncertainty: NaN }))).toBe(contentHash(resultSignedContent({ ...base, uncertainty: NaN })));
  });
});
