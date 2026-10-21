-- 0012: Tính toán & dữ liệu thô (M2.4, M2.5 · ISO/IEC 17025:2017 §7.5, §7.6)

-- Công thức tính kết quả theo phương pháp
create table if not exists public.calc_templates (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name            text not null,
  test_label      text,            -- phép thử áp dụng (danh mục VILAS)
  formula         text not null,   -- VD: C * V * f / m
  reading_var     text not null,   -- biến nhận số đọc từng phép lặp, VD: C
  variables_text  text,            -- mỗi dòng: key | nhãn | đơn vị | mặc định
  result_unit     text,
  use_curve       boolean default false, -- số đọc là tín hiệu → quy đổi nồng độ qua đường chuẩn
  status          text default 'Hiệu lực', -- Hiệu lực | Ngừng sử dụng
  note            text,
  created_at      timestamptz default now()
);

-- Đường chuẩn
create table if not exists public.calibration_curves (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  test_label      text,
  instrument_code text,
  analyzed_at     date,
  valid_until     date,
  analyst         text,
  conc_unit       text,
  signal_unit     text,
  points_text     text,            -- mỗi dòng: nồng độ ; tín hiệu
  r2_min          numeric default 0.995,
  n               integer,
  slope           numeric,
  intercept       numeric,
  r2              numeric,
  syx             numeric,
  lod             numeric,
  loq             numeric,
  min_conc        numeric,
  max_conc        numeric,
  note            text,
  created_at      timestamptz default now()
);

-- Ngân sách độ không đảm bảo đo theo phương pháp
create table if not exists public.uncertainty_budgets (
  id                     uuid primary key default gen_random_uuid(),
  code                   text unique not null,
  name                   text not null,
  test_label             text,
  components_text        text,     -- mỗi dòng: tên | A/B | u tương đối % | nguồn
  k                      numeric default 2,
  include_repeatability  boolean default true,
  include_curve          boolean default false,
  note                   text,
  created_at             timestamptz default now()
);

-- File dữ liệu thô xuất từ thiết bị (lưu nguyên văn + SHA-256)
create table if not exists public.raw_data_files (
  id           uuid primary key default gen_random_uuid(),
  result_id    uuid references public.analysis_results(id) on delete cascade,
  name         text not null,
  size         integer,
  sha256       text not null,
  content      text not null,
  uploaded_by  text,
  uploaded_at  timestamptz default now()
);
create index if not exists idx_raw_data_files_result on public.raw_data_files(result_id);

-- Kết quả: chi tiết tính toán và độ không đảm bảo đo để truy xuất (§7.5)
alter table public.analysis_results
  add column if not exists template_id        text,
  add column if not exists curve_id           text,
  add column if not exists budget_id          text,
  add column if not exists calc_detail        jsonb,
  add column if not exists uncertainty_detail jsonb;
