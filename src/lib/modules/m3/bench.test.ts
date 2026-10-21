import { describe, expect, it } from "vitest";
import { acclimatizePlan, monthGrid, nextStage, recordContamination, shiftMonth, suggestCode, transferPlan } from "./bench";
import type { CultureBatch } from "./data/tissue";

const batch = (o: Partial<CultureBatch> = {}): CultureBatch => ({
  id: "b1",
  code: "MC-01",
  materialId: "m1",
  recipeId: "r1",
  stage: "Nhân nhanh",
  subcultureNo: 2,
  startedAt: "2026-09-01",
  nextTransferAt: "2026-10-01",
  vessels: 50,
  contaminated: 3,
  plantlets: 0,
  room: "",
  operator: "An",
  status: "Đang nuôi",
  parentBatchId: "",
  mediaBatchId: "",
  cabinetId: "c1",
  roomId: "p1",
  explants: 120,
  survived: 0,
  orderId: "o1",
  note: "",
  ...o,
});

describe("cấy chuyển", () => {
  it("cùng giai đoạn: tăng lần cấy, nối mẻ cha, đóng mẻ cha", () => {
    const r = transferPlan(batch(), { code: "MC-02", stage: "Nhân nhanh", startedAt: "2026-10-02", vessels: 80, harvested: 400 });
    if ("error" in r) throw new Error(r.error);
    expect(r.child).toMatchObject({ parentBatchId: "b1", subcultureNo: 3, materialId: "m1", orderId: "o1", roomId: "p1", explants: 400, vessels: 80, status: "Đang nuôi" });
    expect(r.parentPatch).toEqual({ status: "Đã cấy chuyển", contaminated: 3, plantlets: 400 });
  });
  it("sang giai đoạn mới đếm lại lần cấy", () => {
    const r = transferPlan(batch(), { code: "MC-02", stage: "Ra rễ", startedAt: "2026-10-02", vessels: 10 });
    expect("child" in r && r.child.subcultureNo).toBe(1);
  });
  it("chặn lùi giai đoạn, mẻ đã đóng, số liệu sai", () => {
    expect(transferPlan(batch(), { code: "X", stage: "Khởi đầu", startedAt: "2026-10-02", vessels: 1 })).toHaveProperty("error");
    expect(transferPlan(batch({ status: "Hủy" }), { code: "X", stage: "Nhân nhanh", startedAt: "2026-10-02", vessels: 1 })).toHaveProperty("error");
    expect(transferPlan(batch(), { code: "MC-01", stage: "Nhân nhanh", startedAt: "2026-10-02", vessels: 1 })).toHaveProperty("error");
    expect(transferPlan(batch(), { code: "X", stage: "Nhân nhanh", startedAt: "2026-08-01", vessels: 1 })).toHaveProperty("error");
    expect(transferPlan(batch(), { code: "X", stage: "Nhân nhanh", startedAt: "2026-10-02", vessels: 0 })).toHaveProperty("error");
    expect(transferPlan(batch(), { code: "X", stage: "Nhân nhanh", startedAt: "2026-10-02", vessels: 5, parentContaminated: 51 })).toHaveProperty("error");
  });
  it("giai đoạn kế tiếp", () => {
    expect(nextStage("Nhân nhanh")).toBe("Ra rễ");
    expect(nextStage("Ra ngôi")).toBe("Ra ngôi");
  });
});

describe("ra ngôi & ghi nhiễm", () => {
  it("lập lô vườn ươm từ mẻ ra rễ", () => {
    const r = acclimatizePlan(batch({ stage: "Ra rễ", plantlets: 300 }), { code: "LO-01", acclimatizedAt: "2026-10-10", quantity: 280, readyAt: "2026-11-20" });
    if ("error" in r) throw new Error(r.error);
    expect(r.lot).toMatchObject({ batchId: "b1", orderId: "o1", quantity: 280, survived: 280, status: "Vườn ươm" });
    expect(r.batchPatch).toEqual({ status: "Chuyển ra ngôi", plantlets: 300 });
  });
  it("chưa ra rễ thì chưa ra ngôi", () => {
    expect(acclimatizePlan(batch(), { code: "LO", acclimatizedAt: "2026-10-10", quantity: 5 })).toHaveProperty("error");
    expect(acclimatizePlan(batch({ stage: "Ra rễ" }), { code: "LO", acclimatizedAt: "2026-10-10", quantity: 5, readyAt: "2026-10-01" })).toHaveProperty("error");
  });
  it("nhiễm cộng dồn, không vượt số bình", () => {
    expect(recordContamination({ vessels: 50, contaminated: 3 }, 2)).toEqual({ contaminated: 5 });
    expect(recordContamination({ vessels: 50, contaminated: 49 }, 2)).toHaveProperty("error");
    expect(recordContamination({ vessels: 50, contaminated: 0 }, 0)).toHaveProperty("error");
  });
});

describe("lịch tháng", () => {
  it("tuần bắt đầu thứ Hai, đủ 7 ngày, phủ cả tháng", () => {
    const g = monthGrid("2026-10"); // 01/10/2026 là thứ Năm
    expect(g[0][0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(g.every((w) => w.length === 7)).toBe(true);
    expect(g.flat().filter((d) => d.inMonth)).toHaveLength(31);
    expect(g.at(-1)!.at(-1)!.date).toBe("2026-11-01");
  });
  it("chuyển tháng qua năm", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("gợi ý mã", () => {
  it("thêm / tăng hậu tố, tránh mã đã dùng", () => {
    expect(suggestCode("ME-2026-001", [])).toBe("ME-2026-001-1");
    expect(suggestCode("MC-01-2", ["MC-01-3"])).toBe("MC-01-4");
    expect(suggestCode("LO", ["LO-1"])).toBe("LO-2");
  });
});
