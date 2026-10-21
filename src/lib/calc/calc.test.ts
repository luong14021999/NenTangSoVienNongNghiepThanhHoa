// Xác nhận giá trị sử dụng (§7.11.2): công thức tính, đường chuẩn, độ không đảm bảo đo, đọc file thiết bị (M2.4, M2.5, §7.6).
// Giá trị kỳ vọng được tính độc lập bằng Python thuần (không dùng mã của phần mềm).
import { describe, expect, it } from "vitest";
import { evaluate, parse, variablesOf } from "./expression";
import { concFromSignal, fitLinear, sx0 } from "./regression";
import { combineUncertainty } from "./uncertainty";
import { columnValues, parseTable, toNumber } from "./csv";

describe("Công thức tính kết quả", () => {
  it("TC-FX-01 phép toán, thứ tự ưu tiên, ngoặc, lũy thừa kết hợp phải", () => {
    expect(evaluate("2 + 3 * 4", {})).toBe(14);
    expect(evaluate("(2 + 3) * 4", {})).toBe(20);
    expect(evaluate("2 ^ 3 ^ 2", {})).toBe(512);
    expect(evaluate("-2 ^ 2", {})).toBe(4);
    expect(evaluate("10 / 4 - 1", {})).toBe(1.5);
  });
  it("TC-FX-02 công thức theo phương pháp: C × V × f / m (mg/L → mg/kg)", () => {
    // C = 0,532 mg/L · V = 50 mL · f = 2 · m = 1,0025 g → 0,532 × 50 × 2 / 1,0025 / 1000 × 1000
    expect(evaluate("C * V * f / m", { C: 0.532, V: 50, f: 2, m: 1.0025 })).toBeCloseTo(53.0673, 3);
  });
  it("TC-FX-03 dấu phẩy thập phân, dấu ; ngăn cách đối số, hàm toán học", () => {
    expect(evaluate("0,25 * 4", {})).toBe(1);
    expect(evaluate("max(1; 2,5; 2)", {})).toBe(2.5);
    expect(evaluate("sqrt(16) + abs(-1)", {})).toBe(5);
    expect(evaluate("log10(1000)", {})).toBe(3);
  });
  it("TC-FX-04 từ chối mã không an toàn và lỗi cú pháp; báo thiếu biến, chia 0", () => {
    expect(() => parse("process.exit()")).toThrow();
    expect(() => parse("alert(1)")).toThrow(/Hàm không được hỗ trợ/);
    expect(() => parse("2 +")).toThrow();
    expect(() => parse("(2 + 3")).toThrow(/Thiếu/);
    expect(() => evaluate("C * V", { C: 1 })).toThrow(/Thiếu giá trị biến "V"/);
    expect(() => evaluate("1 / (a - a)", { a: 2 })).toThrow(/Chia cho 0/);
  });
  it("TC-FX-05 liệt kê biến của công thức", () => {
    expect(variablesOf("C * V * f / m + C").sort()).toEqual(["C", "V", "f", "m"]);
  });
});

describe("Đường chuẩn tuyến tính", () => {
  const pts = [
    { conc: 0, signal: 0.0021 },
    { conc: 0.5, signal: 0.0518 },
    { conc: 1, signal: 0.1034 },
    { conc: 2, signal: 0.2051 },
    { conc: 4, signal: 0.4087 },
  ];
  it("TC-CC-01 hệ số góc, hệ số chặn, R², s(y/x) khớp tính toán độc lập", () => {
    const f = fitLinear(pts);
    expect(f.slope).toBe(0.101765);
    expect(f.intercept).toBe(0.0015725);
    expect(f.r2).toBe(0.99999309);
    expect(f.syx).toBe(0.00048845);
  });
  it("TC-CC-02 LOD = 3,3·s/b, LOQ = 10·s/b", () => {
    const f = fitLinear(pts);
    expect(f.lod).toBe(0.01584);
    expect(f.loq).toBe(0.048);
  });
  it("TC-CC-03 nội suy nồng độ và s(x0) (Miller & Miller)", () => {
    const f = fitLinear(pts);
    expect(concFromSignal(f, 0.15)).toBeCloseTo(1.45853, 4);
    expect(sx0(f, 0.15, 3)).toBeCloseTo(0.0035058, 6);
  });
  it("TC-CC-04 từ chối đường chuẩn < 3 điểm hoặc nồng độ trùng nhau", () => {
    expect(() => fitLinear(pts.slice(0, 2))).toThrow(/ít nhất 3/);
    expect(() => fitLinear([{ conc: 1, signal: 1 }, { conc: 1, signal: 2 }, { conc: 1, signal: 3 }])).toThrow();
  });
});

describe("Độ không đảm bảo đo – ngân sách", () => {
  it("TC-UN-01 kết hợp căn tổng bình phương, thêm độ lặp lại RSD/√n, U = k·u_c", () => {
    const r = combineUncertainty({
      value: 10,
      k: 2,
      components: [
        { name: "CRM", type: "B", relU: 1.0 },
        { name: "Bình định mức", type: "B", relU: 0.5 },
        { name: "Độ thu hồi", type: "A", relU: 0.8 },
      ],
      rsd: 2,
      n: 3,
    });
    expect(r.relUc).toBe(1.795);
    expect(r.U).toBe(0.36);
    expect(r.rows).toHaveLength(4);
  });
  it("TC-UN-02 thêm thành phần nội suy đường chuẩn s(x0)/x0", () => {
    const r = combineUncertainty({ value: 1.4585, k: 2, components: [], curveSx0: 0.0035058, curveX0: 1.4585 });
    expect(r.rows[0].relU).toBeCloseTo(0.2404, 3);
    expect(r.U).toBeCloseTo(0.0070, 4);
  });
});

describe("Đọc file dữ liệu thiết bị", () => {
  it("TC-IO-01 tự nhận dấu phân cách ; và tiêu đề, số kiểu Việt Nam", () => {
    const t = parseTable("Mã mẫu;Lần;Nồng độ (mg/L)\nM-1;1;0,532\nM-1;2;0,551\nM-2;1;1,204\n");
    expect(t.delimiter).toBe(";");
    expect(t.headers).toEqual(["Mã mẫu", "Lần", "Nồng độ (mg/L)"]);
    expect(columnValues(t, 2, { col: 0, equals: "M-1" })).toEqual([0.532, 0.551]);
  });
  it("TC-IO-02 dấu phẩy, ô có ngoặc kép, không có tiêu đề", () => {
    const t = parseTable('"Sample, A",0.532\n"Sample, B",0.551');
    expect(t.delimiter).toBe(",");
    expect(t.rows[0][0]).toBe("Sample, A");
    expect(columnValues(t, 1)).toEqual([0.532, 0.551]);
  });
  it("TC-IO-03 đọc số: 1 234,5 · 1,234.5 · bỏ qua ô không phải số", () => {
    expect(toNumber("1 234,5")).toBe(1234.5);
    expect(toNumber("1,234.5")).toBe(1234.5);
    expect(toNumber("1.234,5")).toBe(1234.5);
    expect(toNumber("<LOD")).toBeNaN();
    expect(toNumber("2,5e-3")).toBe(0.0025);
  });
});

describe("Định dạng nhập liệu 1 dòng / 1 mục", () => {
  it("TC-TF-01 biến công thức, thành phần ngân sách, điểm chuẩn", async () => {
    const { parseVariables, parseComponents, parsePoints } = await import("./text-formats");
    expect(parseVariables("V | Thể tích định mức | mL | 50\nm|Khối lượng mẫu|g\n# ghi chú")).toEqual([
      { key: "V", label: "Thể tích định mức", unit: "mL", default: 50 },
      { key: "m", label: "Khối lượng mẫu", unit: "g" },
    ]);
    expect(() => parseVariables("2x | sai")).toThrow(/không hợp lệ/);
    expect(parseComponents("CRM | B | 1,0% | GCN\nĐộ thu hồi | a | 0,8")).toEqual([
      { name: "CRM", type: "B", relU: 1, source: "GCN" },
      { name: "Độ thu hồi", type: "A", relU: 0.8, source: "" },
    ]);
    expect(parsePoints("0 ; 0,0021\n0,5\t0,0518\n1 | 0,1034")).toEqual([
      { conc: 0, signal: 0.0021 },
      { conc: 0.5, signal: 0.0518 },
      { conc: 1, signal: 0.1034 },
    ]);
    expect(() => parsePoints("abc")).toThrow(/nồng độ ; tín hiệu/);
  });
  it("TC-TF-02 kiểm tra công thức: biến số đọc phải có, biến khác phải khai báo", async () => {
    const { validateTemplate } = await import("../data/calc-methods");
    const ok = { code: "CT-1", name: "x", formula: "C * V / m", readingVar: "C", variablesText: "V|V|mL\nm|m|g" };
    expect(validateTemplate(ok)).toBeNull();
    expect(validateTemplate({ ...ok, variablesText: "V|V|mL" })).toMatch(/chưa khai báo: m/);
    expect(validateTemplate({ ...ok, readingVar: "X" })).toMatch(/không dùng biến số đọc/);
    expect(validateTemplate({ ...ok, formula: "C * (V" })).toMatch(/Công thức lỗi/);
  });
});

describe("Tính kết quả từ số đọc (đường chuẩn → công thức → thống kê → U)", () => {
  const curve = {
    code: "DC-1",
    points: [
      { conc: 0, signal: 0.0021 },
      { conc: 0.5, signal: 0.0518 },
      { conc: 1, signal: 0.1034 },
      { conc: 2, signal: 0.2051 },
      { conc: 4, signal: 0.4087 },
    ],
    r2Min: 0.995,
    validUntil: "2026-12-31",
    concUnit: "mg/L",
  };
  const template = {
    code: "CT-1",
    formula: "C * V * f / m",
    readingVar: "C",
    variables: [
      { key: "V", label: "Thể tích", unit: "mL", default: 50 },
      { key: "f", label: "Pha loãng", unit: "" },
      { key: "m", label: "Khối lượng", unit: "g" },
    ],
    useCurve: true,
    resultUnit: "mg/kg",
  };
  it("TC-CR-01 toàn chuỗi khớp tính toán độc lập (Python)", async () => {
    const { computeResult } = await import("./compute-result");
    const r = computeResult({
      readings: [0.15, 0.152, 0.149],
      template,
      varValues: { f: 2, m: 1.0025 },
      curve,
      budget: {
        code: "NS-1",
        components: [
          { name: "CRM", type: "B", relU: 1.0 },
          { name: "Bình định mức", type: "B", relU: 0.5 },
        ],
        k: 2,
        includeRepeatability: true,
        includeCurve: true,
      },
    });
    expect(r.values).toEqual([145.489, 147.45, 144.509]);
    expect(r.mean).toBe(145.8);
    expect(r.sd).toBe(1.5);
    expect(r.rsd).toBe(1.03);
    expect(r.U).toBe(3.8);
    expect(r.uncertaintyDetail?.relUc).toBe(1.288);
    expect(r.calcDetail.template?.variables).toEqual({ V: 50, f: 2, m: 1.0025 }); // V lấy giá trị mặc định
  });
  it("TC-CR-02 thiếu biến / thiếu đường chuẩn → báo lỗi, không tính", async () => {
    const { computeResult } = await import("./compute-result");
    expect(() => computeResult({ readings: [0.15], template, varValues: { f: 2 }, curve })).toThrow(/Khối lượng/);
    expect(() => computeResult({ readings: [0.15], template, varValues: { f: 2, m: 1 } })).toThrow(/cần chọn đường chuẩn/);
  });
  it("TC-CR-03 không công thức, không đường chuẩn: số đọc là kết quả, U nhập tay", async () => {
    const { computeResult } = await import("./compute-result");
    const r = computeResult({ readings: [0.232, 0.241, 0.238], manualU: 0.02 });
    expect([r.mean, r.sd, r.rsd, r.U]).toEqual([0.237, 0.00458, 1.93, 0.02]);
  });
});

describe("Chọn cột số đo mặc định khi nhập file thiết bị", () => {
  it("TC-IO-04 ưu tiên cột số thập phân ngoài cùng bên phải, bỏ qua cột STT / Lần", async () => {
    const { defaultValueColumn } = await import("./csv");
    expect(defaultValueColumn(parseTable("Mã mẫu;Lần;Abs\nM-1;1;0,150\nM-1;2;0,152\n"))).toBe(2);
    expect(defaultValueColumn(parseTable("STT;Abs;Ghi chú\n1;0,15;ok\n2;0,16;ok\n"))).toBe(1);
    expect(defaultValueColumn(parseTable("Mẫu;Số đếm\nA;12\nB;15\n"))).toBe(1);
    expect(defaultValueColumn(parseTable("Mẫu;Ghi chú\nA;x\n"))).toBe(-1);
  });
});
