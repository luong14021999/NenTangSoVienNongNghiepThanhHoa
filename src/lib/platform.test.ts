// Kiểm thử nền tảng M1: TOTP, mã hóa / cookie ký, khóa API, dự báo. Giá trị kỳ vọng từ RFC và tính độc lập (Python).
import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, hotp, otpauthUri, totp, verifyTotp } from "@/lib/security/totp";
import { decryptText, encryptText, signValue, verifySignedValue } from "@/lib/security/crypto";
import { generateApiKey, hasScope, hashApiKey, isApiKeyFormat, withinRateLimit } from "@/lib/integration/api-keys";
import { daysToStockout, fitHolt, forecastSeries, holt } from "@/lib/forecast";

const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // ASCII "12345678901234567890"

describe("TC-MF xác thực 2 lớp (TOTP)", () => {
  it("TC-MF-01 base32 khứ hồi và đúng chuẩn RFC 4648", () => {
    expect(base32Encode(Buffer.from("12345678901234567890"))).toBe(RFC_SECRET);
    expect(base32Decode(RFC_SECRET).toString()).toBe("12345678901234567890");
    expect(() => base32Decode("ABC1")).toThrow();
  });
  it("TC-MF-02 HOTP theo bộ kiểm thử RFC 4226", () => {
    const k = Buffer.from("12345678901234567890");
    expect([0, 1, 2, 9].map((c) => hotp(k, c))).toEqual(["755224", "287082", "359152", "520489"]);
  });
  it("TC-MF-03 TOTP theo bộ kiểm thử RFC 6238 (6 chữ số)", () => {
    expect(totp(RFC_SECRET, 59)).toBe("287082");
    expect(totp(RFC_SECRET, 1111111109)).toBe("081804");
    expect(totp(RFC_SECRET, 1234567890)).toBe("005924");
    expect(totp(RFC_SECRET, 2000000000)).toBe("279037");
  });
  it("TC-MF-04 chấp nhận lệch ±1 chu kỳ, từ chối lệch 2 chu kỳ, chặn dùng lại mã", () => {
    const t = 1234567890;
    const code = totp(RFC_SECRET, t);
    expect(verifyTotp(RFC_SECRET, code, t + 30)).toBe(Math.floor(t / 30));
    expect(verifyTotp(RFC_SECRET, code, t + 60)).toBeNull();
    expect(verifyTotp(RFC_SECRET, code, t, Math.floor(t / 30))).toBeNull(); // đã dùng
    expect(verifyTotp(RFC_SECRET, "12345", t)).toBeNull();
    expect(otpauthUri(RFC_SECRET, "a@b.vn", "VNN TH")).toContain("secret=" + RFC_SECRET);
  });
});

describe("TC-SC mã hóa & cookie có chữ ký", () => {
  it("TC-SC-01 AES-GCM khứ hồi; sai khóa hoặc bị sửa → lỗi", () => {
    const enc = encryptText("BI-MAT", "k1");
    expect(decryptText(enc, "k1")).toBe("BI-MAT");
    expect(() => decryptText(enc, "k2")).toThrow();
    const parts = enc.split(".");
    parts[3] = Buffer.from("XX").toString("base64url");
    expect(() => decryptText(parts.join("."), "k1")).toThrow();
  });
  it("TC-SC-02 cookie ký: đúng → payload; hết hạn / sửa / sai khóa → null", () => {
    const v = signValue("ok:user-1", 1000, "s");
    expect(verifySignedValue(v, 999, "s")).toBe("ok:user-1");
    expect(verifySignedValue(v, 1001, "s")).toBeNull();
    expect(verifySignedValue(v.replace("user-1", "user-2"), 999, "s")).toBeNull();
    expect(verifySignedValue(v, 999, "x")).toBeNull();
    expect(verifySignedValue(undefined, 0, "s")).toBeNull();
  });
});

describe("TC-AK khóa API", () => {
  it("TC-AK-01 định dạng, băm, phạm vi, giới hạn tần suất", () => {
    const k = generateApiKey();
    expect(isApiKeyFormat(k)).toBe(true);
    expect(isApiKeyFormat("vnn_short")).toBe(false);
    expect(hashApiKey(k)).toHaveLength(64);
    expect(hashApiKey(k)).toBe(hashApiKey(` ${k} `));
    expect(generateApiKey()).not.toBe(k);
    expect(hasScope(["tests:read"], "tests:read")).toBe(true);
    expect(hasScope(["tests:read"], "stats:read")).toBe(false);
    expect(withinRateLimit(59, 60)).toBe(true);
    expect(withinRateLimit(60, 60)).toBe(false);
    expect(withinRateLimit(1000, 0)).toBe(true);
  });
});

describe("TC-FC dự báo", () => {
  const y = [12, 15, 14, 18, 21, 20, 24, 27];
  it("TC-FC-01 Holt α=0,5 β=0,3 khớp tính độc lập", () => {
    const f = holt(y, 0.5, 0.3);
    expect(f.level).toBeCloseTo(26.38236375, 8);
    expect(f.trend).toBeCloseTo(2.189193375, 8);
    expect(f.rmse).toBeCloseTo(2.00828135022946, 8);
  });
  it("TC-FC-02 chọn tham số theo lưới cho RMSE nhỏ nhất (α=0,4 β=0,5)", () => {
    const f = fitHolt(y);
    expect([f.alpha, f.beta]).toEqual([0.4, 0.5]);
    expect(f.rmse).toBeCloseTo(1.9993153168593918, 8);
    const p = forecastSeries(y, 2).points;
    expect(p[0].value).toBeCloseTo(26.012736 + 2.083008, 6);
    expect(p[1].upper - p[1].value).toBeCloseTo(1.96 * f.rmse * Math.SQRT2, 6);
  });
  it("TC-FC-03 chuỗi tuyến tính dự báo đúng tuyệt đối; dữ liệu ít → trung bình; không âm", () => {
    const lin = [3, 5, 7, 9, 11];
    forecastSeries(lin, 3).points.forEach((p, i) => expect(p.value).toBeCloseTo([13, 15, 17][i], 9));
    expect(forecastSeries([4, 6], 1).points[0].value).toBe(5);
    expect(forecastSeries([9, 6, 3, 0], 2).points.every((p) => p.value >= 0 && p.lower >= 0)).toBe(true);
  });
  it("TC-FC-04 ngày hết tồn kho theo tiêu thụ 90 ngày", () => {
    const u = [{ qty: 45, usedAt: "2026-09-01" }, { qty: 45, usedAt: "2026-10-01" }, { qty: 999, usedAt: "2026-01-01" }];
    const r = daysToStockout(30, u, "2026-10-21");
    expect(r.perDay).toBeCloseTo(1, 10);
    expect(r.days).toBeCloseTo(30, 10);
    expect(daysToStockout(30, [], "2026-10-21").days).toBe(Infinity);
  });
});
