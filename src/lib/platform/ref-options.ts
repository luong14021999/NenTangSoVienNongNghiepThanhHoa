// Lựa chọn cho ô chọn khóa ngoại trong form CRUD (giá trị = id, nhãn = mã · tên).

export function refOptions<T extends { id: string }>(items: T[], label: (x: T) => string) {
  return [{ value: "", label: "— Chưa chọn —" }, ...items.map((x) => ({ value: x.id, label: label(x) }))];
}

/** Tra nhanh bản ghi theo id. */
export const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((x) => [x.id, x]));

/** Lọc theo từ khóa trên các trường văn bản đã ghép. */
export const matches = (q: string, ...parts: (string | number | undefined | null)[]) =>
  !q || parts.filter(Boolean).join(" ").toLowerCase().includes(q);
