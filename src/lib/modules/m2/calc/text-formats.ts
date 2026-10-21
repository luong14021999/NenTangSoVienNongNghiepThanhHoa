// Định dạng văn bản 1 dòng / 1 mục để PTN nhập trực tiếp trong form (hàm thuần, kiểm thử được).
import { toNumber } from "./csv";
import type { BudgetComponent } from "./uncertainty";
import type { CurvePoint } from "./regression";

export type CalcVariable = { key: string; label: string; unit: string; default?: number };

const lines = (text: string) =>
  (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

/** "V | Thể tích định mức | mL | 50" → biến công thức. */
export function parseVariables(text: string): CalcVariable[] {
  return lines(text).map((l, i) => {
    const [key = "", label = "", unit = "", def = ""] = l.split("|").map((s) => s.trim());
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error(`Dòng ${i + 1}: tên biến "${key}" không hợp lệ (chữ cái, số, _)`);
    const d = toNumber(def);
    return { key, label: label || key, unit, ...(Number.isFinite(d) ? { default: d } : {}) };
  });
}

/** "CRM Pb | B | 1,0 | Giấy chứng nhận" → thành phần ngân sách. */
export function parseComponents(text: string): BudgetComponent[] {
  return lines(text).map((l, i) => {
    const [name = "", type = "B", relU = "", source = ""] = l.split("|").map((s) => s.trim());
    const u = toNumber(relU.replace("%", ""));
    if (!name) throw new Error(`Dòng ${i + 1}: thiếu tên thành phần`);
    if (!Number.isFinite(u) || u < 0) throw new Error(`Dòng ${i + 1}: u tương đối "${relU}" không hợp lệ`);
    return { name, type: type.toUpperCase() === "A" ? "A" : "B", relU: u, source };
  });
}

/** "0,5 ; 0,0518" (hoặc tab / 2 cột CSV) → điểm chuẩn nồng độ – tín hiệu. */
export function parsePoints(text: string): CurvePoint[] {
  return lines(text).map((l, i) => {
    const parts = l.split(/\s*[;\t|]\s*|\s{2,}/).filter(Boolean);
    const [conc, signal] = parts.map(toNumber);
    if (!Number.isFinite(conc) || !Number.isFinite(signal)) throw new Error(`Dòng ${i + 1}: "${l}" – cần "nồng độ ; tín hiệu"`);
    return { conc, signal };
  });
}
