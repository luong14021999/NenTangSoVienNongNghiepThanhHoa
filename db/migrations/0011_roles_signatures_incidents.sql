-- 0011: Phân quyền theo vai trò (§7.11.3), ký điện tử + thu hồi phiếu (M2.6), sổ sự cố hệ thống (§7.11.3)

-- Vai trò theo tài khoản đăng nhập (email). Bảng trống = chưa bật phân quyền.
create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  full_name   text,
  roles       jsonb not null default '[]'::jsonb, -- ["Trưởng phòng", "QA/QC", ...]
  active      boolean default true,
  note        text,
  updated_by  text,
  updated_at  timestamptz default now()
);

-- Phiếu kết quả: chữ ký điện tử, mã băm nội dung, thu hồi
alter table public.test_reports
  add column if not exists content_hash  text,
  add column if not exists signature     jsonb,   -- {signer, email, role, meaning, signedAt, method}
  add column if not exists revoked_at    timestamptz,
  add column if not exists revoked_by    text,
  add column if not exists revoke_reason text,
  add column if not exists revoke_signature jsonb;

-- Sổ sự cố / sai lỗi hệ thống thông tin
create table if not exists public.system_incidents (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  occurred_at   date,
  detected_by   text,
  category      text,  -- Lỗi phần mềm | Mất / sai dữ liệu | Truy cập trái phép | Sự cố hạ tầng | Khác
  description   text,
  impact        text,  -- dữ liệu / kết quả bị ảnh hưởng
  action        text,  -- khắc phục, khôi phục
  status        text default 'Mở', -- Mở | Đang xử lý | Đã khắc phục
  closed_at     date,
  nc_code       text,  -- liên kết sổ Không phù hợp & CAPA nếu có
  created_at    timestamptz default now()
);
