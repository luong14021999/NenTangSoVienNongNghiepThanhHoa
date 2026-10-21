import { describe, expect, it } from "vitest";
import { catalogOf, moduleOf, navModules, shellOf, tabsOf } from "./nav-config";

describe("khung điều hướng theo phần mềm", () => {
  it("mỗi tab chỉ trỏ tới trang có trong menu của phần mềm; trang vào thuộc chính phần mềm", () => {
    for (const m of navModules) {
      for (const t of tabsOf(m)) expect(t.items.map((i) => i.href)).toEqual(t.hrefs);
      expect(moduleOf(m.home)?.code).toBe(m.code);
    }
  });
  it.each([
    ["M3.1", "bench"],
    ["M3.2", "hub"],
  ])("%s dùng khung %s: mọi trang nằm ở một tab hoặc trong Danh mục, không trùng", (code, shell) => {
    const m = navModules.find((x) => x.code === code)!;
    expect(shellOf(m)).toBe(shell);
    const inTabs = tabsOf(m).flatMap((t) => t.hrefs);
    const inCatalog = catalogOf(m).flatMap((g) => g.items.map((i) => i.href));
    const all = m.groups.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set([...inTabs, ...inCatalog]).size).toBe(all.length);
    expect(inTabs.length + inCatalog.length).toBe(all.length);
    expect(shellOf(navModules.find((x) => x.code === "M2"))).toBe("sidebar");
  });
});
