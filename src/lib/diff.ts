// So sánh bản ghi cho nhật ký thay đổi – hàm thuần, kiểm thử được.

export type FieldChange = { field: string; old: string; new: string };

/** JSON với khoá sắp xếp – để {a,b} và {b,a} không bị coi là thay đổi. */
const stable = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(stable)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])]))
      : v;

export const show = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(stable(v));
  return String(v);
};

/** So sánh các trường được gửi trong patch với bản ghi cũ. */
export function diffFields(before: Record<string, unknown>, patch: Record<string, unknown>): FieldChange[] {
  return Object.keys(patch)
    .filter((k) => k !== "id" && show(before[k]) !== show(patch[k]))
    .map((k) => ({ field: k, old: show(before[k]), new: show(patch[k]) }));
}
