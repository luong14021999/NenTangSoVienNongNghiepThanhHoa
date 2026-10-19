-- 0003: Mở rộng thiết bị + các nhật ký thiết bị (CRUD)
-- Chạy sau 0001, 0002.

-- 1) Cột mở rộng cho equipment
alter table public.equipment
  add column if not exists serial text,
  add column if not exists manufacturer text,
  add column if not exists commissioned_at date,
  add column if not exists calibration_freq text,
  add column if not exists calibration_place text,
  add column if not exists inspection_freq text,
  add column if not exists inspection_place text;

-- 2) equipment_usage_logs: thêm tên thiết bị (bảng đã có ở 0001)
alter table public.equipment_usage_logs
  add column if not exists equipment_name text;

-- 3) Nhật ký theo dõi hiệu chuẩn thiết bị
create table if not exists public.calibration_logs (
  id             uuid primary key default gen_random_uuid(),
  equipment_code text,
  equipment_name text,
  date           date,
  result         text default 'Đạt',
  certificate    text,
  place          text,
  next_date      date,
  technician     text,
  note           text,
  created_at     timestamptz default now()
);

-- 4) Nhật ký theo dõi bảo trì, bảo dưỡng thiết bị
create table if not exists public.maintenance_logs (
  id             uuid primary key default gen_random_uuid(),
  equipment_code text,
  equipment_name text,
  date           date,
  kind           text default 'Bảo trì định kỳ',
  content        text,
  vendor         text,
  technician     text,
  note           text,
  created_at     timestamptz default now()
);

-- 5) Biên bản kiểm tra / kiểm định thiết bị
create table if not exists public.inspection_records (
  id             uuid primary key default gen_random_uuid(),
  equipment_code text,
  equipment_name text,
  date           date,
  type           text default 'Kiểm tra',
  result         text default 'Đạt',
  conclusion     text,
  inspector      text,
  note           text,
  created_at     timestamptz default now()
);

-- 6) Hướng dẫn sử dụng thiết bị
create table if not exists public.equipment_manuals (
  id             uuid primary key default gen_random_uuid(),
  equipment_code text,
  equipment_name text,
  title          text,
  doc_code       text,
  version        text,
  file_url       text,
  note           text,
  created_at     timestamptz default now()
);
