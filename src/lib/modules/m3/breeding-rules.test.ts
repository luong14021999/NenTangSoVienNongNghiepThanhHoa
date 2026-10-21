import { describe, expect, it } from "vitest";
import {
  ancestors,
  demandVsSupply,
  evaluateCriteria,
  inbreeding,
  productionMetrics,
  seedLotChain,
  validateLevelChain,
  validateParents,
  validityAlert,
} from "./breeding-rules";

const node = (id: string, sireId = "", damId = "") => ({ id, sireId, damId });

describe("hệ số cận huyết (Wright)", () => {
  it("không có tổ tiên chung → 0", () => {
    const F = inbreeding([node("s"), node("d"), node("x", "s", "d")]);
    expect(F.of("x")).toBe(0);
  });
  it("con của anh chị em ruột → 25%", () => {
    const F = inbreeding([node("a"), node("b"), node("s", "a", "b"), node("d", "a", "b"), node("x", "s", "d")]);
    expect(F.of("x")).toBe(0.25);
  });
  it("con của anh chị em cùng cha khác mẹ → 12,5%", () => {
    const F = inbreeding([node("a"), node("m1"), node("m2"), node("s", "a", "m1"), node("d", "a", "m2"), node("x", "s", "d")]);
    expect(F.of("x")).toBe(0.125);
  });
  it("con của anh chị em họ → 6,25%", () => {
    const F = inbreeding([
      node("gs"), node("gd"),
      node("p1", "gs", "gd"), node("p2", "gs", "gd"),
      node("o1"), node("o2"),
      node("s", "p1", "o1"), node("d", "o2", "p2"),
      node("x", "s", "d"),
    ]);
    expect(F.of("x")).toBe(0.0625);
  });
  it("bố phối với con gái → 25%; dữ liệu vòng lặp không treo", () => {
    expect(inbreeding([node("a"), node("b"), node("d", "a", "b"), node("x", "a", "d")]).of("x")).toBe(0.25);
    expect(inbreeding([node("x", "y", ""), node("y", "x", "")]).of("x")).toBeTypeOf("number");
  });
});

describe("phả hệ", () => {
  const nodes = [node("a"), node("b"), node("c", "a", "b"), node("e"), node("x", "c", "e")];
  it("tổ tiên 3 đời theo nhánh bố / mẹ", () => {
    expect(ancestors("x", nodes).map((a) => `${a.path}=${a.id}`)).toEqual(["Bố=c", "Bố › Bố=a", "Bố › Mẹ=b", "Mẹ=e"]);
  });
  it("kiểm tra bố mẹ: giới tính, trùng, vòng lặp", () => {
    const all = [
      { ...node("m"), sex: "Đực", code: "M" },
      { ...node("f"), sex: "Cái", code: "F" },
      { ...node("k", "m", "f"), sex: "Đực", code: "K" },
    ];
    expect(validateParents({ sireId: "m", damId: "f" }, all)).toBeNull();
    expect(validateParents({ sireId: "f", damId: "m" }, all)).toMatch(/không làm bố/);
    expect(validateParents({ sireId: "m", damId: "m" }, all)).toMatch(/cùng một cá thể/);
    expect(validateParents({ id: "m", sireId: "k", damId: "" }, all)).toMatch(/vòng lặp/);
  });
});

describe("đối chiếu bộ chỉ tiêu", () => {
  const criteria = [
    { criterion: "Độ sạch", unit: "%", minValue: 99, maxValue: null },
    { criterion: "Tỷ lệ nảy mầm", unit: "%", minValue: 85, maxValue: null },
    { criterion: "Độ ẩm", unit: "%", minValue: null, maxValue: 13.5 },
    { criterion: "Hạt khác giống", unit: "hạt/kg", minValue: null, maxValue: 0 },
  ];
  it("đạt khi mọi chỉ tiêu có số liệu và nằm trong ngưỡng; khớp tên không dấu", () => {
    const r = evaluateCriteria(criteria, [
      { criterion: "do sach", value: 99.2 },
      { criterion: "TỶ LỆ NẢY MẦM", value: 90 },
      { criterion: "Độ ẩm", value: 12 },
      { criterion: "Hạt khác giống", value: 0 },
    ]);
    expect(r.overall).toBe("Đạt");
  });
  it("ngưỡng tối đa 0 là đúng bằng 0, không phải không giới hạn", () => {
    const r = evaluateCriteria(criteria, [
      { criterion: "Độ sạch", value: 99.5 },
      { criterion: "Tỷ lệ nảy mầm", value: 90 },
      { criterion: "Độ ẩm", value: 12 },
      { criterion: "Hạt khác giống", value: 3 },
    ]);
    expect(r.overall).toBe("Không đạt");
    expect(r.rows.find((x) => x.criterion === "Hạt khác giống")?.result).toBe("Không đạt");
  });
  it("thiếu số liệu → chưa đủ; không có bộ chỉ tiêu", () => {
    expect(evaluateCriteria(criteria, [{ criterion: "Độ sạch", value: 99.5 }]).overall).toBe("Chưa đủ số liệu");
    expect(evaluateCriteria([], []).overall).toBe("Chưa có bộ chỉ tiêu");
  });
});

describe("sản xuất theo cấp, chuỗi lô giống", () => {
  it("nguồn phải ở cấp cao hơn", () => {
    expect(validateLevelChain("Siêu nguyên chủng", "Nguyên chủng")).toBeNull();
    expect(validateLevelChain("Nguyên chủng", "Xác nhận")).toBeNull();
    expect(validateLevelChain("Xác nhận", "Nguyên chủng")).toMatch(/cấp cao hơn/);
    expect(validateLevelChain("Nguyên chủng", "Nguyên chủng")).toMatch(/cấp cao hơn/);
    expect(validateLevelChain("Giống ông bà", "Giống bố mẹ")).toBeNull();
    expect(validateLevelChain(undefined, "Xác nhận")).toBeNull();
  });
  it("chuỗi lô ngược về nguồn giống gốc, chặn vòng lặp", () => {
    const seeds = new Map([
      ["xn", { id: "xn", productionLotId: "p2" }],
      ["nc", { id: "nc", productionLotId: "p1" }],
    ]);
    const prods = new Map([
      ["p2", { id: "p2", sourceSeedLotId: "nc", sourceStockId: "" }],
      ["p1", { id: "p1", sourceSeedLotId: "", sourceStockId: "stock" }],
    ]);
    const r = seedLotChain("xn", seeds, prods);
    expect(r.chain.map((c) => c.seedLot.id)).toEqual(["xn", "nc"]);
    expect(r.sourceStockId).toBe("stock");
    const loop = new Map([["a", { id: "a", productionLotId: "pa" }]]);
    expect(seedLotChain("a", loop, new Map([["pa", { id: "pa", sourceSeedLotId: "a", sourceStockId: "" }]])).chain).toHaveLength(1);
  });
});

describe("hiệu lực, cung – cầu, chỉ số sản xuất", () => {
  it("cảnh báo hiệu lực", () => {
    expect(validityAlert("2026-12-01", "2026-10-21")).toEqual({ kind: "Sắp hết hiệu lực", days: 41 });
    expect(validityAlert("2026-10-01", "2026-10-21")).toEqual({ kind: "Hết hiệu lực", days: 20 });
    expect(validityAlert("2028-01-01", "2026-10-21")).toBeNull();
    expect(validityAlert("", "2026-10-21")).toBeNull();
  });
  it("cân đối cung – cầu theo giống, mùa vụ (không phân biệt dấu), đơn vị", () => {
    const r = demandVsSupply(
      [{ varietyId: "v", season: "Vụ Xuân 2027", quantity: 5000, unit: "kg" }, { varietyId: "v", season: "vu xuan 2027", quantity: 1000, unit: "kg" }],
      [{ varietyId: "v", season: "Vụ Xuân 2027", plannedQty: 4000, actualQty: 0, unit: "kg", status: "Kế hoạch" }, { varietyId: "v", season: "Vụ Xuân 2027", plannedQty: 9999, actualQty: 0, unit: "kg", status: "Hủy" }],
    );
    expect(r).toEqual([{ varietyId: "v", season: "Vụ Xuân 2027", unit: "kg", demand: 6000, planned: 4000, actual: 0, gap: -2000 }]);
  });
  it("năng suất và giá thành", () => {
    expect(productionMetrics({ scale: 2, actualQty: 9000, costTotal: 30_000_000 }, 6_000_000)).toEqual({ yieldPerScale: 4500, unitCost: 4000, cost: 36_000_000 });
    expect(productionMetrics({ scale: 0, actualQty: 0, costTotal: 0 })).toEqual({ yieldPerScale: null, unitCost: null, cost: 0 });
  });
});
