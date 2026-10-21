import { describe, expect, it } from "vitest";
import { convertQty, costPerPlantlet, lotCost, mediaCostPerLiter, orderProgress, planOrder, stockOf, validateGrading } from "./production";

const profile = { multiplicationRate: 3, cycleDays: 30, rootingDays: 30, nurseryDays: 45, invitroSurvival: 90, nurserySurvival: 85, grade1Share: 80 };

describe("kế hoạch tính ngược theo đơn hàng", () => {
  it("số lượng từng khâu và số lần cấy chuyển", () => {
    const p = planOrder({ quantity: 10_000, dueAt: "2027-06-30", gradeRequired: "Loại 1" }, profile, { stockShoots: 100, today: "2026-10-21" });
    // 10.000 ÷ 0,8 = 12.500 cây sống; ÷ 0,85 = 14.706 ra ngôi; ÷ 0,9 = 16.340 chồi ra rễ
    expect(p).toMatchObject({ sellable: 12_500, toAcclimatize: 14_706, toRoot: 16_340 });
    // 100 × 3ⁿ ≥ 16.340 → n = 5
    expect(p.cycles).toBe(5);
    // giao 30/06/2027 − 45 ngày vườn ươm − 30 ngày ra rễ − 5 × 30 ngày nhân nhanh
    expect(p.dates).toEqual({ multiplyBy: "2026-11-17", rootingBy: "2027-04-16", acclimatizeBy: "2027-05-16", dueAt: "2027-06-30" });
    expect(p.feasible).toBe(true);
    expect(p.slackDays).toBe(27);
    // Cùng đơn nhưng hôm nay đã qua hạn bắt đầu nhân → không kịp
    expect(planOrder({ quantity: 10_000, dueAt: "2027-06-30", gradeRequired: "Loại 1" }, profile, { stockShoots: 100, today: "2026-12-01" })).toMatchObject({ feasible: false, slackDays: -14 });
  });
  it("đủ chồi sẵn thì không cần nhân; không yêu cầu Loại 1 thì không chia tỷ lệ Loại 1", () => {
    const p = planOrder({ quantity: 1000, dueAt: "2027-06-30", gradeRequired: "Không yêu cầu" }, profile, { stockShoots: 5000, today: "2026-10-21" });
    expect(p.sellable).toBe(1000);
    expect(p.cycles).toBe(0);
    expect(p.feasible).toBe(true);
  });
  it("chưa có ngày giao → không có mốc thời gian", () => {
    expect(planOrder({ quantity: 10, dueAt: "", gradeRequired: "Loại 1" }, profile, { stockShoots: 1, today: "2026-10-21" }).dates).toBeNull();
  });
});

describe("quy đổi đơn vị & chi phí môi trường", () => {
  it("khối lượng, thể tích; khác loại → null", () => {
    expect(convertQty(500, "mg", "g")).toBe(0.5);
    expect(convertQty(2, "kg", "g")).toBe(2000);
    expect(convertQty(250, "µl", "ml")).toBe(0.25);
    expect(convertQty(1, "g", "ml")).toBeNull();
    expect(convertQty(3, "cái", "cái")).toBe(3);
  });
  it("chi phí / lít, báo dòng chưa tính được", () => {
    const supplies = new Map([
      ["sucrose", { unit: "kg", unitPrice: 30_000 }],
      ["bap", { unit: "g", unitPrice: 2_000_000 }],
    ]);
    const r = mediaCostPerLiter(
      [
        { chemical: "Sucrose", amountPerL: 30, unit: "g", supplyId: "sucrose" },
        { chemical: "BAP", amountPerL: 2, unit: "mg", supplyId: "bap" },
        { chemical: "Agar", amountPerL: 7, unit: "g", supplyId: "" },
      ],
      supplies,
    );
    expect(r.cost).toBeCloseTo(900 + 4000);
    expect(r.missing).toEqual(["Agar"]);
  });
});

describe("giá thành qua các lần cấy chuyển", () => {
  const rates = { laborPerVessel: 1000, overheadPerVessel: 500, nurseryPerPlant: 2000 };
  const batches = new Map([
    ["a", { id: "a", parentBatchId: "", explants: 10, vessels: 10, plantlets: 40, mediaBatchId: "m" }],
    ["b", { id: "b", parentBatchId: "a", explants: 40, vessels: 20, plantlets: 100, mediaBatchId: "m" }],
  ]);
  const media = () => 500; // 500 đ / bình
  it("mẻ đầu: chi phí trực tiếp ÷ chồi", () => {
    // 10 bình × (500 + 1000 + 500) = 20.000 ÷ 40 chồi = 500
    expect(costPerPlantlet("a", batches, media, rates)).toBe(500);
  });
  it("mẻ cấy chuyển cộng giá thành chồi nhận từ mẻ cha", () => {
    // 40 chồi × 500 + 20 bình × 2000 = 60.000 ÷ 100 = 600
    expect(costPerPlantlet("b", batches, media, rates)).toBe(600);
  });
  it("lô: + vườn ươm, chia cho cây sống", () => {
    expect(lotCost({ quantity: 100, survived: 80 }, 600, rates)).toEqual({ total: 260_000, perPlant: 3250 });
    expect(lotCost({ quantity: 100, survived: 80 }, null, rates)).toBeNull();
  });
  it("chặn vòng lặp dữ liệu", () => {
    const loop = new Map([
      ["x", { id: "x", parentBatchId: "y", explants: 1, vessels: 1, plantlets: 1, mediaBatchId: "" }],
      ["y", { id: "y", parentBatchId: "x", explants: 1, vessels: 1, plantlets: 1, mediaBatchId: "" }],
    ]);
    expect(costPerPlantlet("x", loop, media, rates)).toBeTypeOf("number");
  });
});

describe("kho, đơn hàng, vườn ươm", () => {
  it("tồn kho = nhập − xuất ± điều chỉnh", () => {
    expect(stockOf([{ kind: "Nhập", quantity: 1000 }, { kind: "Xuất", quantity: 300 }, { kind: "Kiểm kê điều chỉnh", quantity: -20 }])).toBe(680);
  });
  it("tiến độ đơn hàng và giao đúng hạn", () => {
    const o = { quantity: 1000, dueAt: "2027-03-01" };
    expect(orderProgress(o, [{ quantity: 600, soldAt: "2027-02-20" }, { quantity: 400, soldAt: "2027-03-01" }])).toEqual({ delivered: 1000, pct: 100, onTime: true });
    expect(orderProgress(o, [{ quantity: 600, soldAt: "2027-02-20" }, { quantity: 400, soldAt: "2027-03-05" }]).onTime).toBe(false);
  });
  it("phân loại không vượt số cây sống", () => {
    expect(validateGrading({ quantity: 100, survived: 90, grade1Qty: 70, grade2Qty: 15, rejectQty: 5 })).toBeNull();
    expect(validateGrading({ quantity: 100, survived: 90, grade1Qty: 80, grade2Qty: 15, rejectQty: 5 })).toMatch(/vượt/);
    expect(validateGrading({ quantity: 100, survived: 110, grade1Qty: 0, grade2Qty: 0, rejectQty: 0 })).toMatch(/sống/);
  });
});
