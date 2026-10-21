import { describe, expect, it } from "vitest";
import { budgetSummary, duplicateLevel, findDuplicates, milestoneProgress, normalizeVi, similarity, taskAlerts, tokens, validateTask } from "./research";
import { permissionForEntity, roleAllows } from "@/lib/platform/permissions";

const base = { status: "Đề xuất", approvalNo: "", approvedAt: "", acceptanceResult: "", acceptedAt: "", startAt: "2026-01-01", endAt: "2027-12-31" };

describe("vòng đời nhiệm vụ", () => {
  it("đề xuất không cần quyết định", () => {
    expect(validateTask(base)).toBeNull();
  });
  it("từ Được phê duyệt trở đi phải có số và ngày QĐ", () => {
    expect(validateTask({ ...base, status: "Đang thực hiện" })).toMatch(/quyết định phê duyệt/);
    expect(validateTask({ ...base, status: "Đang thực hiện", approvalNo: "123/QĐ-VNN", approvedAt: "2026-01-05" })).toBeNull();
  });
  it("nghiệm thu phải có kết quả và ngày", () => {
    const ok = { ...base, approvalNo: "1", approvedAt: "2026-01-05", status: "Đã nghiệm thu" };
    expect(validateTask(ok)).toMatch(/nghiệm thu/);
    expect(validateTask({ ...ok, acceptanceResult: "Khá", acceptedAt: "2027-12-20" })).toBeNull();
    expect(validateTask({ ...ok, acceptanceResult: "Giỏi", acceptedAt: "2027-12-20" })).toMatch(/không hợp lệ/);
  });
  it("ngày kết thúc phải sau ngày bắt đầu; trạng thái lạ bị chặn", () => {
    expect(validateTask({ ...base, endAt: "2025-12-31" })).toMatch(/sau ngày bắt đầu/);
    expect(validateTask({ ...base, status: "Xong" })).toBe("Trạng thái không hợp lệ");
  });
});

describe("chống trùng lặp", () => {
  it("bỏ dấu tiếng Việt và ký tự lạ", () => {
    expect(normalizeVi("Nghiên cứu Giống LÚA chịu mặn – Đông Sơn!")).toBe("nghien cuu giong lua chiu man dong son");
  });
  it("bỏ từ chung chung (nghiên cứu, Thanh Hóa…)", () => {
    expect([...tokens("Nghiên cứu ứng dụng chế phẩm sinh học tại tỉnh Thanh Hóa")]).toEqual(["che", "pham", "sinh", "hoc"]);
  });
  it("tên gần giống → điểm cao; khác chủ đề → thấp", () => {
    const a = { title: "Nghiên cứu tuyển chọn giống lúa chịu mặn cho vùng ven biển tỉnh Thanh Hóa", keywords: "lúa, chịu mặn, ven biển" };
    const b = { title: "Tuyển chọn và phát triển giống lúa chịu mặn vùng ven biển Thanh Hóa", keywords: "giống lúa, mặn, ven biển" };
    const c = { title: "Xây dựng mô hình nuôi tôm thẻ chân trắng công nghệ cao", keywords: "tôm, nuôi trồng" };
    expect(similarity(a, b)).toBeGreaterThanOrEqual(0.5);
    expect(similarity(a, c)).toBeLessThan(0.3);
    expect(duplicateLevel(similarity(a, b))).toBe("Nghi trùng cao");
  });
  it("tìm trùng: lọc ngưỡng, sắp giảm dần, bỏ chính nó", () => {
    const list = [
      { id: "1", title: "Tuyển chọn giống lúa chịu mặn vùng ven biển" },
      { id: "2", title: "Nuôi tôm thẻ chân trắng" },
      { id: "self", title: "Tuyển chọn giống lúa chịu mặn vùng ven biển" },
    ];
    const r = findDuplicates({ title: "Giống lúa chịu mặn ven biển" }, list, { excludeId: "self" });
    expect(r.map((x) => x.item.id)).toEqual(["1"]);
  });
});

describe("tiến độ, kinh phí, cảnh báo", () => {
  const ms = [
    { dueAt: "2026-03-01", doneAt: "2026-02-28" },
    { dueAt: "2026-06-01", doneAt: "" },
    { dueAt: "2026-12-01", doneAt: "" },
  ];
  it("tiến độ theo mốc", () => {
    expect(milestoneProgress(ms, "2026-10-21")).toEqual({ total: 3, done: 1, overdue: 1, pct: 33 });
  });
  it("kinh phí", () => {
    expect(budgetSummary({ budgetState: 300_000_000, budgetOther: 100_000_000 }, [{ amount: 150_000_000 }, { amount: 50_000_000 }])).toEqual({
      total: 400_000_000,
      spent: 200_000_000,
      remaining: 200_000_000,
      pct: 50,
    });
  });
  it("cảnh báo chỉ cho nhiệm vụ đang triển khai", () => {
    const t = { status: "Đang thực hiện", endAt: "2026-11-10", budgetState: 100, budgetOther: 0 };
    expect(taskAlerts(t, ms, [{ amount: 120 }], "2026-10-21")).toEqual([
      { kind: "Mốc trễ hạn", detail: "1 mốc" },
      { kind: "Sắp kết thúc", detail: "còn 20 ngày" },
      { kind: "Vượt kinh phí", detail: "120%" },
    ]);
    expect(taskAlerts({ ...t, endAt: "2026-09-30" }, [], [], "2026-10-21")).toEqual([{ kind: "Quá hạn kết thúc", detail: "21 ngày" }]);
    expect(taskAlerts({ ...t, status: "Đề xuất" }, ms, [{ amount: 120 }], "2026-10-21")).toEqual([]);
  });
  it("phân quyền nhiệm vụ KH&CN", () => {
    expect(permissionForEntity("research-tasks")).toBe("write.research");
    expect(roleAllows(["Quản lý khoa học"], "write.research")).toBe(true);
    expect(roleAllows(["Dịch vụ – Kế toán"], "write.research")).toBe(false);
  });
});
