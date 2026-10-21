import { describe, expect, it } from "vitest";
import { commonAncestors, levelSteps, matingCandidates, nextLevel, pedigreeGrid, roleLabel, seedLotLeft } from "./breed-workspace";

// Phả hệ: S1 × D1 → A (đực), B (cái) – anh em ruột; X là đực ngoài dòng; C = con của A × B.
const n = (id: string, sex: string, sireId = "", damId = "", status = "Đang sử dụng") => ({ id, code: id, sex, sireId, damId, status });
const nodes = [n("S1", "Đực"), n("D1", "Cái"), n("A", "Đực", "S1", "D1"), n("B", "Cái", "S1", "D1"), n("X", "Đực"), n("C", "Cái", "A", "B"), n("OLD", "Đực", "", "", "Loại thải")];

describe("cây phả hệ", () => {
  it("lưới 2^g ô, giữ vị trí ô chưa rõ", () => {
    const g = pedigreeGrid("C", nodes, 3);
    expect(g.map((r) => r.length)).toEqual([2, 4, 8]);
    expect(g[0].map((s) => s.id)).toEqual(["A", "B"]);
    expect(g[1].map((s) => s.id)).toEqual(["S1", "D1", "S1", "D1"]);
    expect(g[2].every((s) => s.id === null)).toBe(true);
    expect(g[1].map((s) => s.label)).toEqual(["Ông nội", "Bà nội", "Ông ngoại", "Bà ngoại"]);
  });
  it("nhãn đời cụ", () => {
    expect(roleLabel("MBM")).toBe("Cụ (mẹ › bố › mẹ)");
  });
  it("tổ tiên chung", () => {
    expect(commonAncestors("A", "B", nodes).sort()).toEqual(["D1", "S1"]);
    expect(commonAncestors("X", "B", nodes)).toEqual([]);
    expect(commonAncestors("A", "C", nodes)).toContain("A");
  });
});

describe("ghép phối thử", () => {
  it("xếp con đực theo F đời con, bỏ cá thể loại thải; anh em ruột 25%", () => {
    const r = matingCandidates("B", nodes);
    expect(r.map((x) => x.partner.id)).toEqual(["X", "A", "S1"]);
    expect(r[0]).toMatchObject({ f: 0, warn: false });
    const a = r.find((x) => x.partner.id === "A")!;
    expect(a.f).toBe(0.25);
    expect(a.warn).toBe(true);
    expect(r.find((x) => x.partner.id === "S1")!.f).toBe(0.25); // bố × con gái
    expect(r.some((x) => x.partner.id === "OLD")).toBe(false);
    expect(matingCandidates("X", nodes).map((x) => x.partner.id)).toEqual(["B", "C", "D1"]);
  });
});

describe("lô giống", () => {
  it("còn lại sau giao", () => {
    expect(seedLotLeft({ id: "l", quantity: 100 }, [{ seedLotId: "l", quantity: 30 }, { seedLotId: "k", quantity: 99 }])).toBe(70);
  });
  it("cấp nhân tiếp", () => {
    expect(nextLevel("Siêu nguyên chủng")).toBe("Nguyên chủng");
    expect(nextLevel("Xác nhận")).toBe("Xác nhận 2");
    expect(nextLevel("Giống ông bà")).toBe("Giống bố mẹ");
    expect(nextLevel("Khác")).toBe("Khác");
  });
});

describe("bậc thang cấp giống", () => {
  it("xếp cấp cao trên, đếm lô, lượng còn lại chỉ tính lô đạt", () => {
    const steps = levelSteps(
      [
        { id: "a", level: "Nguyên chủng", status: "Đã chứng nhận", quantity: 100, unit: "kg" },
        { id: "b", level: "Siêu nguyên chủng", status: "Chờ kiểm định", quantity: 20, unit: "kg" },
        { id: "c", level: "Nguyên chủng", status: "Không đạt", quantity: 50, unit: "kg" },
      ],
      [{ level: "Xác nhận 1", status: "Đang sản xuất" }, { level: "Khác", status: "Hủy" }],
      [{ seedLotId: "a", quantity: 30 }],
    );
    expect(steps.map((s) => s.level)).toEqual(["Siêu nguyên chủng", "Nguyên chủng", "Xác nhận 1"]);
    expect(steps[1]).toEqual({ level: "Nguyên chủng", lots: 2, certified: 1, producing: 0, left: [{ quantity: 70, unit: "kg" }] });
    expect(steps[2].producing).toBe(1);
  });
});
