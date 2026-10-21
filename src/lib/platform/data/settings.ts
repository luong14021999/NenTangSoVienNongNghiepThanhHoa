// Cấu hình hệ thống (M1.8): khóa → giá trị JSON, có người sửa và thời điểm sửa.
import { dbQuery, isDbConfigured } from "@/lib/platform/db";

export const SETTINGS = {
  mfa_required: { label: "Bắt buộc xác thực 2 lớp cho mọi tài khoản", type: "bool", default: false },
  mfa_trust_hours: { label: "Ghi nhớ trình duyệt đã xác thực 2 lớp (giờ)", type: "number", default: 12 },
  api_default_rate_limit: { label: "Giới hạn mặc định cho khóa API mới (lượt / phút)", type: "number", default: 60 },
  backup_retention_days: { label: "Thời gian giữ nhật ký sức khỏe / sao lưu (ngày)", type: "number", default: 30 },
  maintenance_banner: { label: "Thông báo bảo trì hiển thị cho người dùng (để trống = tắt)", type: "text", default: "" },
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
