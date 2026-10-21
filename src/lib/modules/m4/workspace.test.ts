import { describe, expect, it } from "vitest";
import { barPosition, boxOf, customerDraft, elapsedPct, ganttWindow, matchCustomer, parseBox, quotationDraft } from "./workspace";

describe("hộp thư yêu cầu", () => {
  it("xếp trạng thái vào hộp", () => {
    expect(boxOf("Mới tiếp nhận")).toBe("new");
    expect(boxOf("Đã báo giá")).toBe("quoted");
    expect(boxOf("Từ chối")).toBe("closed");
    expect(parseBox("xyz")).toBe("new");
    expect(parseBox("all")).toBe("all");
  });
  it("khớp khách hàng theo số điện thoại rồi theo tên", () => {
    const cs = [
      { id: "a", name: "HTX Nông nghiệp Thọ Xuân", phone: "0912 345 678" },
      { id: "b", name: "Nguyễn Văn An", phone: "" },
    ];
    expect(matchCustomer({ phone: "+84912345678", orgName: "", contactName: "X" }, cs)?.id).toBe("a");
    expect(matchCustomer({ phone: "0900000000", orgName: "", contactName: "  nguyễn  văn an " }, cs)?.id).toBe("b");
    expect(matchCustomer({ phone: "0900000000", orgName: "Khác", contactName: "Y" }, cs)).toBeNull();
  });
  it("lập hồ sơ khách & báo giá nháp từ yêu cầu", () => {
    expect(customerDraft({ orgName: "", contactName: "Lê Thị Hoa", phone: "+84 912 000 111", address: " Thọ Xuân " }, ["KH-2026-004"], 2026)).toEqual({
      code: "KH-2026-005",
      name: "Lê Thị Hoa",
      kind: "Nông hộ",
      contact: "",
      phone: "0912000111",
      address: "Thọ Xuân",
    });
    const q = quotationDraft({ code: "YC-2026-ABC", kind: "Phân tích – thử nghiệm", description: "Phân tích   đất trồng lúa", sampleCount: 3 }, "c1", "2026-10-22");
    expect(q).toEqual({ customerId: "c1", title: "Phân tích – thử nghiệm (3 mẫu): Phân tích đất trồng lúa", issuedAt: "2026-10-22", validUntil: "2026-11-21", note: "Lập từ yêu cầu YC-2026-ABC" });
  });
});

describe("Gantt", () => {
  const w = ganttWindow(2026, 2026);
  it("12 cột tháng phủ đủ 100%", () => {
    expect(w.months).toHaveLength(12);
    expect(w.months.reduce((s, m) => s + m.width, 0)).toBeCloseTo(100);
    expect(w.months[0]).toMatchObject({ key: "2026-01", left: 0, yearStart: true });
  });
  it("thanh trong khung, bị cắt, ngoài khung", () => {
    const full = barPosition("2026-01-01", "2026-12-31", w)!;
    expect(full.left).toBe(0);
    expect(full.width).toBeCloseTo(100);
    const cut = barPosition("2025-07-01", "2026-06-30", w)!;
    expect(cut).toMatchObject({ left: 0, clippedStart: true, clippedEnd: false });
    expect(cut.width).toBeCloseTo((181 / 365) * 100);
    expect(barPosition("2024-01-01", "2025-12-31", w)).toBeNull();
    expect(barPosition("2026-05-01", "", w)).toBeNull();
    expect(barPosition("2026-05-01", "2026-04-01", w)).toBeNull();
  });
  it("% thời gian đã trôi qua", () => {
    expect(elapsedPct("2026-01-01", "2026-12-31", "2025-12-01")).toBe(0);
    expect(elapsedPct("2026-01-01", "2026-01-10", "2026-01-06")).toBe(50);
    expect(elapsedPct("2026-01-01", "2026-01-10", "2027-01-01")).toBe(100);
  });
});
