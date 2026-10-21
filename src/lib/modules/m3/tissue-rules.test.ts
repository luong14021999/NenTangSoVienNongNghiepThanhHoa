import { describe, expect, it } from "vitest";
import {
  batchSurvivalRate,
  contaminationBy,
  lineage,
  multiplicationRate,
  readingAlerts,
  validateCultureBatch,
  validateMaterialSource,
  validateMediaBatch,
  validateReading,
} from "./tissue-rules";
import { permissionForEntity } from "@/lib/platform/permissions";
import { hasScope } from "@/lib/platform/integration/api-keys";

describe("mẻ cấy: hệ số nhân, tỷ lệ sống", () => {
  it("hệ số nhân = chồi ÷ mẫu đưa vào", () => {
    expect(multiplicationRate({ plantlets: 450, explants: 100 })).toBe(4.5);
    expect(multiplicationRate({ plantlets: 10, explants: 3 })).toBe(3.33);
    expect(multiplicationRate({ plantlets: 10, explants: 0 })).toBeNull();
  });
  it("tỷ lệ sống", () => {
    expect(batchSurvivalRate({ survived: 92, explants: 100 })).toBe(92);
  });
});

describe("thống kê nhiễm theo nhóm", () => {
  const batches = [
    { cabinet: "TC-01", vessels: 100, contaminated: 3 },
    { cabinet: "TC-01", vessels: 100, contaminated: 5 },
    { cabinet: "TC-02", vessels: 50, contaminated: 9 },
    { cabinet: "TC-03", vessels: 10, contaminated: 2 },
    { cabinet: "", vessels: 20, contaminated: 0 },
  ];
  const g = contaminationBy(batches, (b) => b.cabinet, 7);
  it("tỷ lệ nhóm = tổng bình nhiễm ÷ tổng bình, sắp giảm dần", () => {
    expect(g.map((x) => [x.key, x.rate])).toEqual([
      ["TC-03", 20],
      ["TC-02", 18],
      ["TC-01", 4],
      ["Chưa ghi", 0],
    ]);
  });
  it("đánh dấu vượt ngưỡng và nhóm ít mẫu (< 20 bình)", () => {
    expect(g.find((x) => x.key === "TC-02")).toMatchObject({ overThreshold: true, smallSample: false, batches: 1 });
    expect(g.find((x) => x.key === "TC-03")).toMatchObject({ overThreshold: true, smallSample: true });
    expect(g.find((x) => x.key === "TC-01")).toMatchObject({ overThreshold: false, vessels: 200, contaminated: 8 });
  });
});

describe("truy nguyên mẻ cha – con", () => {
  const b = [
    { id: "a", parentBatchId: "" },
    { id: "b", parentBatchId: "a" },
    { id: "c", parentBatchId: "b" },
  ];
  it("chuỗi từ mẻ hiện tại về mẻ đầu", () => {
    expect(lineage("c", b).map((x) => x.id)).toEqual(["c", "b", "a"]);
  });
  it("không lặp vô hạn khi dữ liệu có vòng", () => {
    const loop = [{ id: "x", parentBatchId: "y" }, { id: "y", parentBatchId: "x" }];
    expect(lineage("x", loop).map((x) => x.id)).toEqual(["x", "y"]);
  });
});

describe("ràng buộc dữ liệu", () => {
  const base = { id: "c", parentBatchId: "", startedAt: "2026-10-10", vessels: 50, contaminated: 2, explants: 40, survived: 38 };
  const ok = { code: "LMT-1", qcResult: "Đạt", expiresAt: "2026-11-01" };
  const batches = [{ id: "a", parentBatchId: "" }, { id: "b", parentBatchId: "a" }, { id: "c", parentBatchId: "b" }];
  it("chỉ dùng lô môi trường Đạt, còn hạn", () => {
    expect(validateCultureBatch(base, { mediaBatch: ok, batches })).toBeNull();
    expect(validateCultureBatch(base, { mediaBatch: { ...ok, qcResult: "Chờ kiểm tra" }, batches })).toMatch(/chưa đạt/);
    expect(validateCultureBatch(base, { mediaBatch: { ...ok, expiresAt: "2026-10-01" }, batches })).toMatch(/hết hạn/);
  });
  it("số liệu hợp lý; mẻ cha không tạo vòng", () => {
    expect(validateCultureBatch({ ...base, contaminated: 60 }, { batches })).toMatch(/bình nhiễm/);
    expect(validateCultureBatch({ ...base, survived: 41 }, { batches })).toMatch(/mẫu sống/);
    expect(validateCultureBatch({ ...base, id: "a", parentBatchId: "c" }, { batches })).toMatch(/vòng lặp/);
    expect(validateCultureBatch({ ...base, parentBatchId: "c" }, { batches })).toMatch(/chính mẻ này/);
  });
  it("chặn vật liệu từ cây mẹ nhiễm bệnh", () => {
    expect(validateMaterialSource({ code: "CM-1", diseaseStatus: "Nhiễm bệnh" })).toMatch(/nhiễm bệnh/);
    expect(validateMaterialSource({ code: "CM-1", diseaseStatus: "Chưa kiểm tra" })).toBeNull();
    expect(validateMaterialSource(null)).toBeNull();
  });
  it("lô môi trường Đạt phải ghi hấp tiệt trùng; pH hợp lý", () => {
    expect(validateMediaBatch({ phMeasured: 5.8, autoclaveTempC: 121, autoclaveMinutes: 20, qcResult: "Đạt" })).toBeNull();
    expect(validateMediaBatch({ phMeasured: 5.8, autoclaveTempC: 0, autoclaveMinutes: 0, qcResult: "Đạt" })).toMatch(/hấp tiệt trùng/);
    expect(validateMediaBatch({ phMeasured: 12, autoclaveTempC: 121, autoclaveMinutes: 20, qcResult: "Chờ kiểm tra" })).toMatch(/pH/);
  });
});

describe("phòng nuôi & thiết bị đo", () => {
  const room = { tempMin: 23, tempMax: 27, humidityMin: 50, humidityMax: 75, lightMin: 2000, lightMax: 4000 };
  it("cảnh báo thông số ngoài ngưỡng", () => {
    expect(readingAlerts(room, { temperature: 29.5, humidity: 60, light: 1500 }).map((a) => a.field)).toEqual(["Nhiệt độ", "Ánh sáng"]);
    expect(readingAlerts(room, { temperature: 25, humidity: null, light: null })).toEqual([]);
  });
  it("kiểm tra số liệu thiết bị gửi", () => {
    expect(validateReading({ temperature: "25.1", humidity: 62 })).toEqual({ value: { temperature: 25.1, humidity: 62, light: null, at: null } });
    expect(validateReading({})).toHaveProperty("error");
    expect(validateReading({ humidity: 120 })).toHaveProperty("error");
    expect(validateReading({ temperature: 25, at: "không phải ngày" })).toHaveProperty("error");
    expect(validateReading({ temperature: 25, at: new Date(Date.now() + 3_600_000).toISOString() })).toEqual({ error: "at ở tương lai" });
  });
  it("phân quyền & phạm vi khóa API", () => {
    expect(permissionForEntity("media-batches")).toBe("write.tissue");
    expect(permissionForEntity("growth-rooms")).toBe("write.tissue");
    expect(hasScope(["m3:readings"], "m3:readings")).toBe(true);
    expect(hasScope(["stats:read"], "m3:readings")).toBe(false);
  });
});
