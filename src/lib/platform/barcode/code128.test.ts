// Xác nhận giá trị sử dụng (§7.11.2): mã vạch nhãn mẫu Code 128-B (M2.1).
import { describe, expect, it } from "vitest";
import { PATTERNS, STOP, code128Svg, encodeB, moduleWidths } from "./code128";

describe("Mã vạch Code 128-B", () => {
  it("TC-BC-01 bảng mẫu: 106 mẫu, mỗi mẫu 6 phần tử tổng 11 mô-đun, không trùng; STOP 13 mô-đun", () => {
    expect(PATTERNS).toHaveLength(106);
    for (const p of PATTERNS) {
      expect(p).toMatch(/^[1-4]{6}$/);
      expect([...p].reduce((s, d) => s + Number(d), 0)).toBe(11);
    }
    expect(new Set(PATTERNS).size).toBe(106);
    expect([...STOP].reduce((s, d) => s + Number(d), 0)).toBe(13);
    expect(PATTERNS[104]).toBe("211214"); // START B
  });
  it("TC-BC-02 checksum theo chuẩn: (104 + Σ giá trị × vị trí) mod 103", () => {
    // "PJJ123C": 104 + 48·1 + 42·2 + 42·3 + 17·4 + 18·5 + 19·6 + 35·7 = 879 → 879 mod 103 = 55
    expect(encodeB("PJJ123C").at(-1)).toBe(55);
    // mã mẫu thực tế – giá trị kiểm tra tính độc lập bằng Python
    expect(encodeB("M-VNNTH-2026-00318").at(-1)).toBe(78);
    // "M-1": 104 + 45·1 + 13·2 + 17·3 = 226 → 226 mod 103 = 20
    expect(encodeB("M-1")).toEqual([104, 45, 13, 17, 20]);
  });
  it("TC-BC-03 số mô-đun = 11 × (số ký tự + 2) + 13; bắt đầu bằng vạch, kết thúc bằng vạch", () => {
    const code = "M-VNNTH-2026-00318";
    const w = moduleWidths(code);
    expect(w.reduce((s, x) => s + x, 0)).toBe(11 * (code.length + 2) + 13);
    expect(w.length % 2).toBe(1); // số phần tử lẻ → phần tử cuối là vạch
    expect(code128Svg(code)).toContain("<svg");
  });
  it("TC-BC-04 từ chối ký tự ngoài bộ B (VD có dấu tiếng Việt)", () => {
    expect(() => encodeB("Mẫu")).toThrow(/không mã hóa được/);
  });
});
