// Bộ kiểm thử xác nhận giá trị sử dụng phần mềm (ISO/IEC 17025:2017 §7.11.2):
// các phép tính và quy tắc ảnh hưởng trực tiếp đến kết quả báo cáo.
// Mỗi ca kiểm thử có mã TC-… để trích dẫn trong hồ sơ xác nhận.
import { describe, expect, it } from "vitest";
import { concludeWith, verdictOfZ, zonesOf } from "./quality";
import { applyRule, parseNum, parseNumbers, statsOf } from "./results";
import { accreditedTests, testLabels, testNoOf } from "@/lib/modules/m2/accreditation";
import type { DecisionRule } from "@/lib/mock-data";

const rule = (r: Partial<DecisionRule>): DecisionRule => ({
  id: "r1",
  criterion: "Pb",
  matrix: "Đất",
  method: "",
  unit: "mg/kg",
  limit: 0.3,
  limitDirection: "max",
  limitSource: "",
  uncertainty: 0.04,
  ruleType: "Guarded acceptance (w = U)",
  notes: "",
  approvedBy: "",
  approvedAt: "",
  ...r,
});

describe("Quy tắc quyết định – guard band w = U (JCGM 106)", () => {
  const pb = rule({});
  it("TC-DR-01 giới hạn trên: x ≤ L − U → Đạt (kể cả đúng biên)", () => {
    expect(concludeWith(0.25, pb).conclusion).toBe("Đạt");
    expect(concludeWith(0.26, pb).conclusion).toBe("Đạt");
  });
  it("TC-DR-02 L − U < x ≤ L + U → Vô định (kể cả đúng biên trên)", () => {
    expect(concludeWith(0.2600001, pb).conclusion).toBe("Vô định");
    expect(concludeWith(0.3, pb).conclusion).toBe("Vô định");
    expect(concludeWith(0.34, pb).conclusion).toBe("Vô định");
  });
  it("TC-DR-03 x > L + U → Không đạt", () => {
    expect(concludeWith(0.3400001, pb).conclusion).toBe("Không đạt");
  });
  it("TC-DR-04 ngưỡng vùng được làm tròn, không sai số dấu phẩy động", () => {
    expect(zonesOf(pb)).toMatchObject({ acceptanceUpper: 0.26, rejectionUpper: 0.34 });
  });
  it("TC-DR-05 khoảng 2 phía, simple acceptance", () => {
    const ph = rule({ ruleType: "Simple acceptance (không guard band)", limitDirection: "range", limit: 7.5, limitMin: 4.5 });
    expect(concludeWith(4.4, ph).conclusion).toBe("Không đạt");
    expect(concludeWith(4.5, ph).conclusion).toBe("Đạt");
    expect(concludeWith(7.5, ph).conclusion).toBe("Đạt");
    expect(concludeWith(7.6, ph).conclusion).toBe("Không đạt");
  });
  it("TC-DR-06 khoảng 2 phía, guarded acceptance", () => {
    const p = rule({ limitDirection: "range", limit: 16.5, limitMin: 15.5, uncertainty: 0.32 });
    expect(concludeWith(15.0, p).conclusion).toBe("Không đạt");
    expect(concludeWith(15.6, p).conclusion).toBe("Vô định");
    expect(concludeWith(16.0, p).conclusion).toBe("Đạt");
    expect(concludeWith(16.3, p).conclusion).toBe("Vô định");
    expect(concludeWith(17.0, p).conclusion).toBe("Không đạt");
  });
  it("TC-DR-07 giới hạn dưới (min), guarded acceptance", () => {
    const m = rule({ limitDirection: "min", limit: 5, uncertainty: 0.5 });
    expect(concludeWith(5.5, m).conclusion).toBe("Đạt");
    expect(concludeWith(5.2, m).conclusion).toBe("Vô định");
    expect(concludeWith(4.4, m).conclusion).toBe("Không đạt");
  });
  it("TC-DR-08 guarded rejection: chỉ Không đạt khi x > L + U", () => {
    const g = rule({ ruleType: "Guarded rejection (w = U)" });
    expect(concludeWith(0.33, g).conclusion).toBe("Đạt");
    expect(concludeWith(0.35, g).conclusion).toBe("Không đạt");
  });
  it("TC-DR-09 theo thỏa thuận khách hàng → Báo cáo giá trị", () => {
    expect(concludeWith(999, rule({ ruleType: "Theo thỏa thuận khách hàng" })).conclusion).toBe("Báo cáo giá trị");
  });
  it("TC-DR-10 kết luận dùng U của kết quả khi có (ưu tiên hơn U của quy tắc)", () => {
    // U của quy tắc 0,04 → 0,27 Vô định; U kết quả 0,02 → vùng chấp nhận ≤ 0,28 → Đạt
    expect(applyRule(0.27, undefined, pb).conclusion).toBe("Vô định");
    expect(applyRule(0.27, 0.02, pb).conclusion).toBe("Đạt");
    expect(applyRule(0.27, 0.02, pb).acceptance_upper).toBe(0.28);
  });
  it("TC-DR-11 không chọn quy tắc → Báo cáo giá trị, không công bố sự phù hợp", () => {
    expect(applyRule(1, 0.1, undefined).conclusion).toBe("Báo cáo giá trị");
  });
});

describe("Thống kê phép lặp", () => {
  it("TC-ST-01 x̄, SD mẫu (n − 1), RSD %", () => {
    // 0,232 · 0,241 · 0,238 → x̄ 0,237 · SD 0,00458 · RSD 1,93 %
    expect(statsOf([0.232, 0.241, 0.238])).toEqual({ mean: 0.237, sd: 0.00458, rsd: 1.93 });
  });
  it("TC-ST-02 1 phép lặp → SD = 0", () => {
    expect(statsOf([3.2])).toEqual({ mean: 3.2, sd: 0, rsd: 0 });
  });
  it("TC-ST-03 không có giá trị → không tính", () => {
    expect(statsOf([]).mean).toBeUndefined();
  });
  it("TC-ST-04 nhập số kiểu Việt Nam (dấu phẩy thập phân, ngăn cách ; hoặc khoảng trắng)", () => {
    expect(parseNumbers("0,232; 0,241 0.238")).toEqual([0.232, 0.241, 0.238]);
    expect(parseNumbers("abc; ; 1,5")).toEqual([1.5]);
    expect(parseNum("98,5")).toBe(98.5);
    expect(parseNum("")).toBeUndefined();
  });
});

describe("Thử nghiệm thành thạo – z-score (ISO 13528)", () => {
  it("TC-PT-01 |z| ≤ 2 Đạt · 2 < |z| < 3 Cảnh báo · |z| ≥ 3 Không đạt", () => {
    expect(verdictOfZ(2)).toBe("Đạt");
    expect(verdictOfZ(-2)).toBe("Đạt");
    expect(verdictOfZ(2.5)).toBe("Cảnh báo");
    expect(verdictOfZ(3)).toBe("Không đạt");
    expect(verdictOfZ(-3.4)).toBe("Không đạt");
  });
});

describe("Danh mục phép thử VILAS 1501", () => {
  it("TC-AC-01 đủ 59 phép thử, đánh số liên tục, nhãn duy nhất", () => {
    expect(accreditedTests).toHaveLength(59);
    expect(accreditedTests.every((t, i) => t.no === i + 1)).toBe(true);
    expect(new Set(testLabels).size).toBe(59);
  });
  it("TC-AC-02 đọc lại số TT từ nhãn phép thử", () => {
    expect(testNoOf(testLabels[11])).toBe(12);
    expect(testNoOf("không phải nhãn")).toBeNaN();
  });
});
