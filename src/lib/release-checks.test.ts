// Xác nhận giá trị sử dụng (§7.11.2): kiểm soát trước phát hành kết quả (M2.5, M2.7, M2.2).
import { describe, expect, it } from "vitest";
import {
  DEFAULT_RULES,
  belowLoq,
  blockers,
  evaluateRelease,
  parseLoq,
  type CheckInput,
  type ReleaseRules,
} from "./release-checks";
import { accreditedTests } from "./accreditation";

const pbSoil = accreditedTests.find((t) => t.no === 12)!; // Pb đất, LOQ 0,25 mg/kg, TCVN 6496B:2009
const gcms = accreditedTests.find((t) => t.no === 24)!; // PP nội bộ AEMD-HD
const ph = accreditedTests.find((t) => t.no === 21)!; // pH 2,0 ~ 10,0

const base = (over: Partial<CheckInput> = {}, r: Partial<CheckInput["result"]> = {}): CheckInput => ({
  result: {
    criterion: "#12 Pb",
    unit: "mg/kg",
    mean: 1.2,
    rsd: 2,
    uncertainty: 0.1,
    matrixSpikeRecovery: 98,
    instrumentCode: "TB-001",
    referenceMaterial: "CRM Pb",
    technician: "KTV A",
    startedAt: "2026-10-20T08:00:00Z",
    decisionRuleType: "Guarded acceptance (w = U)",
    conclusion: "Đạt",
    ...r,
  },
  test: pbSoil,
  equipment: [{ code: "TB-001", name: "AAS", status: "Hoạt động", nextCalibration: "2027-01-01" }],
  authorizations: [
    { staffName: "KTV A", testNo: 12, role: "Thực hiện phép thử", active: true },
    { staffName: "TP B", testNo: 12, role: "Phê duyệt & ký phiếu kết quả", active: true },
  ],
  validations: [{ testNo: 12, conclusion: "Đạt" }],
  qcCharts: [
    {
      criterion: "Pb",
      method: "TCVN 6496B:2009",
      mean: 10,
      sd: 1,
      points: [
        { date: "2026-10-18", value: 10.2, technician: "KTV A" },
        { date: "2026-10-19", value: 9.8, technician: "KTV A" },
      ],
    },
  ],
  chemicals: [{ name: "CRM Pb", expiry: "2027-06-30" }],
  ...over,
});
const status = (input: CheckInput, key: string, rules: ReleaseRules = DEFAULT_RULES) =>
  evaluateRelease(rules, input).find((c) => c.key === key)?.status;

describe("Đọc giới hạn định lượng / phạm vi đo từ danh mục VILAS", () => {
  it("TC-RC-01 LOQ dạng số + đơn vị, phạm vi dạng a ~ b, LOQ trống", () => {
    expect(parseLoq("0,25 mg/kg")).toEqual({ kind: "min", value: 0.25, unit: "mg/kg" });
    expect(parseLoq("0,02 mg/kg mỗi chất")).toEqual({ kind: "min", value: 0.02, unit: "mg/kg" });
    expect(parseLoq("4,0 μg/L")).toEqual({ kind: "min", value: 4, unit: "µg/l" });
    expect(parseLoq("2,0 ~ 10,0")).toEqual({ kind: "range", lo: 2, hi: 10 });
    expect(parseLoq("")).toBeNull();
    expect(parseLoq("K: 0,1 · Na: 0,5 · Ca: 1,0 · Mg: 1,0 meq/100g")).toBeNull();
  });
  it("TC-RC-02 nhận biết kết quả < LOQ chỉ khi cùng đơn vị", () => {
    const loq = parseLoq("0,25 mg/kg");
    expect(belowLoq(0.2, "mg/kg", loq)).toBe(true);
    expect(belowLoq(0.25, "mg/kg", loq)).toBe(false);
    expect(belowLoq(0.2, "µg/kg", loq)).toBe(false);
  });
});

describe("Kiểm soát trước phát hành", () => {
  it("TC-RC-03 hồ sơ đầy đủ → không có điều kiện chặn", () => {
    expect(blockers(evaluateRelease(DEFAULT_RULES, { ...base(), approverName: "TP B" }))).toHaveLength(0);
  });
  it("TC-RC-04 tự khóa thiết bị quá hạn hiệu chuẩn hoặc không Hoạt động", () => {
    expect(status(base({ equipment: [{ code: "TB-001", name: "AAS", status: "Hoạt động", nextCalibration: "2026-10-01" }]}), "equipmentCalibration")).toBe("Chặn");
    expect(status(base({ equipment: [{ code: "TB-001", name: "AAS", status: "Bảo trì", nextCalibration: "2027-01-01" }]}), "equipmentCalibration")).toBe("Chặn");
    expect(status(base({ equipment: [{ code: "TB-001", name: "AAS", status: "Hoạt động", nextCalibration: "" }]}), "equipmentCalibration")).toBe("Không áp dụng");
  });
  it("TC-RC-05 KTV chưa được ủy quyền thực hiện phép thử → Chặn", () => {
    expect(status(base({}, { technician: "KTV khác" }), "technicianAuthorization")).toBe("Chặn");
    const inactive = base({ authorizations: [{ staffName: "KTV A", testNo: 12, role: "Thực hiện phép thử", active: false }] });
    expect(status(inactive, "technicianAuthorization")).toBe("Chặn");
  });
  it("TC-RC-06 người phê duyệt phải được ủy quyền Phê duyệt & ký phiếu", () => {
    expect(status({ ...base(), approverName: "TP B" }, "approverAuthorization")).toBe("Đạt");
    expect(status({ ...base(), approverName: "KTV A" }, "approverAuthorization")).toBe("Chặn");
    expect(status(base(), "approverAuthorization")).toBeUndefined(); // chưa tới bước phê duyệt
  });
  it("TC-RC-07 phương pháp nội bộ thiếu hồ sơ XN GTSD → Chặn; tiêu chuẩn → Cảnh báo", () => {
    expect(status(base({ test: gcms, validations: [] }), "methodValidationInHouse")).toBe("Chặn");
    expect(status(base({ validations: [] }), "methodValidationStandard")).toBe("Cảnh báo");
    expect(status(base({ validations: [{ testNo: 12, conclusion: "Không đạt" }] }), "methodValidationStandard")).toBe("Cảnh báo");
  });
  it("TC-RC-08 dưới LOQ → Cảnh báo; ngoài phạm vi đo → Chặn", () => {
    expect(status(base({}, { mean: 0.2 }), "belowLoq")).toBe("Cảnh báo");
    expect(status(base({}, { mean: 0.25 }), "belowLoq")).toBe("Đạt");
    expect(status(base({ test: ph }, { mean: 11, unit: "" }), "outOfRange")).toBe("Chặn");
    expect(status(base({ test: ph }, { mean: 6.5, unit: "" }), "outOfRange")).toBe("Đạt");
  });
  it("TC-RC-09 RSD và độ thu hồi so với tiêu chí cài đặt", () => {
    expect(status(base({}, { rsd: 6 }), "rsd")).toBe("Cảnh báo");
    expect(status(base({}, { matrixSpikeRecovery: 85 }), "recovery")).toBe("Cảnh báo");
    const strict: ReleaseRules = { ...DEFAULT_RULES, rsd: { level: "Chặn", max: 1.5 } };
    expect(status(base(), "rsd", strict)).toBe("Chặn");
  });
  it("TC-RC-10 điểm QC gần nhất trước ngày phân tích vi phạm 1-3s → Chặn; điểm sau ngày phân tích không tính", () => {
    const bad = base();
    bad.qcCharts[0].points.push({ date: "2026-10-20", value: 13.5, technician: "KTV A" });
    expect(status(bad, "qcWestgard")).toBe("Chặn");
    const later = base();
    later.qcCharts[0].points.push({ date: "2026-10-25", value: 13.5, technician: "KTV A" });
    expect(status(later, "qcWestgard")).toBe("Đạt");
  });
  it("TC-RC-11 CRM hết hạn tại ngày phân tích → Chặn", () => {
    expect(status(base({ chemicals: [{ name: "CRM Pb", expiry: "2026-09-30" }] }), "crmExpired")).toBe("Chặn");
  });
  it("TC-RC-12 quy tắc guard band nhưng thiếu U → Chặn; Vô định → Cảnh báo", () => {
    expect(status(base({}, { uncertainty: NaN }), "uncertaintyMissing")).toBe("Chặn");
    expect(status(base({}, { conclusion: "Vô định" }), "inconclusive")).toBe("Cảnh báo");
  });
  it("TC-RC-13 quy tắc đặt mức Tắt thì không đánh giá", () => {
    const off: ReleaseRules = { ...DEFAULT_RULES, technicianAuthorization: "Tắt" };
    expect(status(base({}, { technician: "KTV khác" }), "technicianAuthorization", off)).toBeUndefined();
  });
});

describe("Nhật ký thay đổi", () => {
  it("TC-CL-01 chỉ ghi trường thực sự thay đổi; thứ tự khoá trong đối tượng không tính là thay đổi", async () => {
    const { diffFields } = await import("./diff");
    expect(diffFields({ a: 1, r: { min: 90, max: 110 } }, { a: 1, r: { max: 110, min: 90 } })).toEqual([]);
    expect(diffFields({ a: 1, b: "x" }, { a: 2, b: "x" })).toEqual([{ field: "a", old: "1", new: "2" }]);
    expect(diffFields({ a: null }, { a: "" })).toEqual([]);
  });
});
