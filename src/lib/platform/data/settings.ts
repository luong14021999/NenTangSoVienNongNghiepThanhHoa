// Cấu hình hệ thống (M1.8): khóa → giá trị JSON, có người sửa và thời điểm sửa.
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

/** Nhóm cấu hình – cột trái của trang Cấu hình. */
export const SETTING_GROUPS = {
  security: { label: "Bảo mật & đăng nhập", hint: "Xác thực 2 lớp, ghi nhớ trình duyệt" },
  integration: { label: "Tích hợp & API", hint: "Khóa API, giới hạn tần suất" },
  operations: { label: "Vận hành & thông báo", hint: "Lưu giữ nhật ký, thông báo bảo trì" },
  tissue: { label: "Nuôi cấy mô (M3.1)", hint: "Ngưỡng nhiễm, định mức giá thành" },
} as const;
export type SettingGroup = keyof typeof SETTING_GROUPS;

export const SETTINGS = {
  mfa_required: { label: "Bắt buộc xác thực 2 lớp cho mọi tài khoản", type: "bool", group: "security", default: false },
  mfa_trust_hours: { label: "Ghi nhớ trình duyệt đã xác thực 2 lớp (giờ)", type: "number", group: "security", default: 12 },
  api_default_rate_limit: { label: "Giới hạn mặc định cho khóa API mới (lượt / phút)", type: "number", group: "integration", default: 60 },
  backup_retention_days: { label: "Thời gian giữ nhật ký sức khỏe / sao lưu (ngày)", type: "number", group: "operations", default: 30 },
  tissue_contamination_threshold: { label: "M3.1: ngưỡng cảnh báo tỷ lệ nhiễm mẫu nuôi cấy mô (%)", type: "number", group: "tissue", default: 7 },
  tissue_labor_per_vessel: { label: "M3.1 giá thành: nhân công cấy mỗi bình (VND)", type: "number", group: "tissue", default: 0 },
  tissue_overhead_per_vessel: { label: "M3.1 giá thành: chi phí chung mỗi bình – điện, khấu hao phòng nuôi (VND)", type: "number", group: "tissue", default: 0 },
  tissue_nursery_per_plant: { label: "M3.1 giá thành: chi phí vườn ươm mỗi cây – bầu, giá thể, chăm sóc (VND)", type: "number", group: "tissue", default: 0 },
  maintenance_banner: { label: "Thông báo bảo trì hiển thị cho người dùng (để trống = tắt)", type: "text", group: "operations", default: "" },
} as const;
export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = (typeof SETTINGS)[K]["default"] extends boolean ? boolean : (typeof SETTINGS)[K]["default"] extends number ? number : string;

export async function getSettings(): Promise<{ [K in SettingKey]: SettingValue<K> } & { _meta: Record<string, { updatedBy: string; updatedAt: string }> }> {
  const out = Object.fromEntries(Object.entries(SETTINGS).map(([k, v]) => [k, v.default])) as Record<string, unknown>;
  const meta: Record<string, { updatedBy: string; updatedAt: string }> = {};
  if (isDbConfigured()) {
    for (const r of await dbQuery(`select key, value, updated_by, updated_at from public.system_settings`)) {
      if (r.key in SETTINGS) {
        out[r.key as string] = r.value;
        meta[r.key as string] = { updatedBy: (r.updated_by as string) ?? "", updatedAt: (r.updated_at as string) ?? "" };
      }
    }
  }
  return { ...(out as { [K in SettingKey]: SettingValue<K> }), _meta: meta };
}

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  if (!isDbConfigured()) return SETTINGS[key].default as SettingValue<K>;
  const [r] = await dbQuery(`select value from public.system_settings where key = $1`, [key]);
  return (r ? r.value : SETTINGS[key].default) as SettingValue<K>;
}

/** Ép kiểu theo định nghĩa; trả về lỗi nếu không hợp lệ. */
export function coerceSetting(key: string, raw: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  const def = SETTINGS[key as SettingKey];
  if (!def) return { ok: false, error: `Không có cấu hình ${key}` };
  if (def.type === "bool") return { ok: true, value: raw === true || raw === "true" || raw === "Đạt" };
  if (def.type === "number") {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: `${def.label}: phải là số ≥ 0` };
    return { ok: true, value: n };
  }
  return { ok: true, value: String(raw ?? "") };
}

export async function setSetting(key: SettingKey, value: unknown, actor: string) {
  await dbQuery(
    `insert into public.system_settings (key, value, updated_by, updated_at) values ($1, $2::jsonb, $3, now())
     on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`,
    [key, JSON.stringify(value), actor],
  );
}
