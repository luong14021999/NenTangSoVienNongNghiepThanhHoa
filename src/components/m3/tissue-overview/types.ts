// Kiểu dữ liệu trình bày cho trang "Dây chuyền nuôi cấy" (M3.1). Trang tự tính, thành phần chỉ hiển thị.

export type PipelineItem = {
  id: string;
  href: string;
  code: string;
  /** Loài · giống (truy ngược mẻ cha → vật liệu, hoặc theo đơn hàng). */
  title: string;
  /** Các dòng thông tin ngắn: ngày cấy, số bình, tủ… */
  facts: string[];
  /** Ghi chú hạn (cấy chuyển / đủ tiêu chuẩn). */
  due?: { label: string; tone: "red" | "amber" | "muted" };
  /** Mức "môi trường trong bình": % thời gian chu kỳ đã trôi qua (0–100). */
  fill?: number;
};

export type PipelineStage = {
  key: string;
  name: string;
  hint: string;
  /** Số chính và đơn vị: "5 mẻ", "1.200 cây"… */
  primary: { value: number; unit: string };
  secondary: string;
  items: PipelineItem[];
  /** Tổng số mục (có thể lớn hơn số thẻ hiển thị). */
  total: number;
  moreHref: string;
  emptyText: string;
  group: "invitro" | "nursery" | "out";
};

export type RoomMetric = {
  label: string;
  unit: string;
  value: number | null;
  min: number;
  max: number;
  out: boolean;
};

export type RoomTile = {
  id: string;
  code: string;
  name: string;
  deviceCode: string;
  state: "ok" | "out" | "stale" | "none";
  lastAt: string;
  source: string;
  metrics: RoomMetric[];
  batches: number;
  photoperiod: string;
};

export type MonthRate = { key: string; label: string; vessels: number; contaminated: number; rate: number | null };

export type TodoItem = {
  id: string;
  href: string;
  kind: "transfer" | "media" | "nursery" | "order";
  code: string;
  text: string;
  when: string;
  tone: "red" | "amber" | "muted";
  /** Dùng để sắp xếp: số ngày còn lại (âm = quá hạn). */
  days: number;
};
