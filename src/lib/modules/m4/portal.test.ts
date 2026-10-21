import { describe, expect, it } from "vitest";
import { isValidPhone, newRequestCode, normalizePhone, routeRequest, validatePublicRequest } from "./portal";
import { safeUrl } from "./data/portal";
import { permissionForEntity, roleAllows } from "@/lib/platform/permissions";

const ok = {
  kind: "Phân tích – thử nghiệm",
  contactName: "Nguyễn Văn A",
  phone: "+84 912 345 678",
  description: "Phân tích 10 mẫu đất trồng lúa",
};

describe("M4.1 định tuyến yêu cầu", () => {
  it("chuyển đến đúng đơn vị theo loại dịch vụ", () => {
    expect(routeRequest("Phân tích – thử nghiệm")).toBe("M2 – Phòng Phân tích và Thí nghiệm");
    expect(routeRequest("Nuôi cấy mô – cây giống")).toBe("M3.1 – Nuôi cấy mô");
    expect(routeRequest("Giống cây trồng, vật nuôi, thủy sản")).toBe("M3.2 – Giống");
    expect(routeRequest("Tư vấn – chuyển giao")).toBe("Bộ phận tư vấn");
    expect(routeRequest("Khác")).toBe("Bộ phận tư vấn");
  });
});

describe("M4.1 mã yêu cầu", () => {
  it("định dạng YC-năm-6 ký tự, không có ký tự dễ nhầm", () => {
    for (let i = 0; i < 200; i++) expect(newRequestCode(2026)).toMatch(/^YC-2026-[2-9A-HJKMNP-Z]{6}$/);
  });
  it("dùng hàm ngẫu nhiên truyền vào (kiểm thử được)", () => {
    expect(newRequestCode(2026, () => 0)).toBe("YC-2026-222222");
  });
});

describe("M4.1 kiểm tra dữ liệu khách gửi", () => {
  it("chuẩn hóa số điện thoại +84 → 0", () => {
    expect(normalizePhone("+84 912 345 678")).toBe("0912345678");
    expect(normalizePhone("0912.345.678")).toBe("0912345678");
    expect(isValidPhone("12345")).toBe(false);
  });

  it("nhận dữ liệu hợp lệ, cắt khoảng trắng, giới hạn số mẫu", () => {
    const r = validatePublicRequest({ ...ok, contactName: "  Nguyễn Văn A ", sampleCount: 99999 });
    expect("value" in r && r.value).toMatchObject({ contactName: "Nguyễn Văn A", phone: "0912345678", sampleCount: 10000 });
  });

  it("từ chối loại dịch vụ lạ, thiếu tên, điện thoại sai, email sai, mô tả ngắn, quá dài", () => {
    expect(validatePublicRequest({ ...ok, kind: "Hack" })).toEqual({ error: "Chọn loại dịch vụ" });
    expect(validatePublicRequest({ ...ok, contactName: " " })).toEqual({ error: "Nhập họ tên người liên hệ" });
    expect(validatePublicRequest({ ...ok, phone: "abc" })).toEqual({ error: "Số điện thoại không hợp lệ" });
    expect(validatePublicRequest({ ...ok, email: "x@" })).toEqual({ error: "Email không hợp lệ" });
    expect(validatePublicRequest({ ...ok, description: "ngắn" })).toEqual({ error: "Mô tả yêu cầu ít nhất 10 ký tự" });
    expect("error" in validatePublicRequest({ ...ok, description: "x".repeat(3001) })).toBe(true);
  });

  it("bỏ qua trường không phải chuỗi (chống đưa object vào)", () => {
    expect(validatePublicRequest({ ...ok, contactName: { $ne: "" } })).toEqual({ error: "Nhập họ tên người liên hệ" });
  });
});

describe("M4.7 dữ liệu công bố", () => {
  it("chỉ cho phép liên kết http(s)", () => {
    expect(safeUrl("https://viennongnghiepthanhhoa.gov.vn/bm01.pdf")).toBe("https://viennongnghiepthanhhoa.gov.vn/bm01.pdf");
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("data:text/html,x")).toBe("");
  });

  it("quyền xử lý yêu cầu và quản lý bảng giá", () => {
    expect(permissionForEntity("service-requests")).toBe("write.requests");
    expect(permissionForEntity("price-items")).toBe("write.services");
    expect(roleAllows(["Tiếp nhận mẫu"], "write.requests")).toBe(true);
    expect(roleAllows(["Tiếp nhận mẫu"], "write.services")).toBe(false);
    expect(roleAllows(["Chỉ xem"], "write.requests")).toBe(false);
  });
});
