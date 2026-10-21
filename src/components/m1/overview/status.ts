// Mức trạng thái dùng chung cho bảng điều hành M1 (trung tâm giám sát nền tảng).
export type Level = "ok" | "warn" | "down" | "idle";

export const LEVEL_LABEL: Record<Level, string> = {
  ok: "Hoạt động",
  warn: "Cảnh báo",
  down: "Gián đoạn",
  idle: "Chưa có dữ liệu",
};

/** Màu chấm trạng thái (màu trạng thái, không theo màu phân hệ). */
export const LEVEL_DOT: Record<Level, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  down: "bg-red-500",
  idle: "bg-zinc-400",
};

/** Màu chữ đủ tương phản trên nền card (sáng / tối). */
export const LEVEL_TEXT: Record<Level, string> = {
  ok: "text-emerald-700 dark:text-emerald-400",
  warn: "text-amber-700 dark:text-amber-400",
  down: "text-red-700 dark:text-red-400",
  idle: "text-muted-foreground",
};

const RANK: Record<Level, number> = { idle: 0, ok: 1, warn: 2, down: 3 };

/** Mức nghiêm trọng nhất trong danh sách (bỏ qua "idle" nếu có mức khác). */
export function worst(levels: Level[]): Level {
  return levels.reduce<Level>((w, l) => (RANK[l] > RANK[w] ? l : w), "idle");
}

/** Mốc thời gian hiện tại – tách ra để thành phần render giữ tính thuần. */
export const nowMs = () => Date.now();

/** "5 phút trước", "3 giờ trước", "2 ngày trước"; "—" nếu trống. */
export function ago(iso: string | null | undefined, now: number) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "vừa xong";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
}

export const bytes = (b: number) =>
  !b ? "—" : b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} kB`;

export const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
