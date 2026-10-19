-- LIMS Viện Nông Nghiệp Thanh Hóa – schema khởi tạo
-- Postgres / Supabase

-- Helpers
create extension if not exists "pgcrypto";

-- =========================================================
-- 1. CUSTOMERS
-- =========================================================
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name            text not null,
  kind            text not null, -- Doanh nghiệp | HTX | Nông hộ | Cơ quan nhà nước | Viện/Trường
  contact         text,
  phone           text,
  address         text,
  samples_ytd     integer default 0,
  last_sample_at  date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- =========================================================
-- 2. STAFF
-- =========================================================
create table if not exists public.staff (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  full_name     text not null,
  position      text,
  department    text,
  email         text,
  phone         text,
  joined_at     date,
  competencies  jsonb default '[]'::jsonb,
  trainings     jsonb default '[]'::jsonb,
  status        text default 'Đang làm việc', -- Đang làm việc | Nghỉ phép | Thử việc
  created_at    timestamptz default now()
);

-- =========================================================
-- 3. EQUIPMENT
-- =========================================================
create table if not exists public.equipment (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  name              text not null,
  model             text,
  location          text,
  last_calibration  date,
  next_calibration  date,
  status            text default 'Hoạt động', -- Hoạt động | Hiệu chuẩn | Bảo trì | Ngừng
  usage_hours       integer default 0,
  created_at        timestamptz default now()
);

create table if not exists public.equipment_usage_logs (
  id              uuid primary key default gen_random_uuid(),
  equipment_id    uuid references public.equipment(id) on delete cascade,
  equipment_code  text,
  technician      text,
  sample_code     text,
  started_at      timestamptz,
  duration_min    integer,
  created_at      timestamptz default now()
);

create table if not exists public.maintenance_schedule (
  id              uuid primary key default gen_random_uuid(),
  equipment_id    uuid references public.equipment(id) on delete cascade,
  equipment_code  text,
  kind            text, -- Bảo trì định kỳ | Hiệu chuẩn | Sửa chữa
  scheduled_at    date,
  vendor          text,
  created_at      timestamptz default now()
);

create table if not exists public.environment_readings (
  id            uuid primary key default gen_random_uuid(),
  room          text not null,
  parameter     text, -- Nhiệt độ | Độ ẩm
  value         numeric,
  unit          text,
  limit_text    text, -- giới hạn quy định
  recorded_at   timestamptz,
  observer      text,
  pass          boolean,
  created_at    timestamptz default now()
);

-- =========================================================
-- 4. TOOLS (dụng cụ)
-- =========================================================
create table if not exists public.tools (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,
  name                  text not null,
  category              text,
  spec                  text,
  qty                   integer default 0,
  unit                  text,
  min_qty               integer default 0,
  location              text,
  calibration_required  boolean default false,
  last_calibration      date,
  next_calibration      date,
  status                text default 'Sẵn sàng'
);

-- =========================================================
-- 5. CHEMICALS (hóa chất – chất chuẩn)
-- =========================================================
create table if not exists public.chemicals (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  name                text not null,
  cas                 text,
  unit                text,
  stock               numeric default 0,
  min_stock           numeric default 0,
  expiry              date,
  hazard              text, -- Thường | Độc hại | Dễ cháy | Ăn mòn
  location            text,
  technical_spec      text,
  manufacturer        text,
  manufacture_date    date,
  received_at         date,
  storage_condition   text,
  used_for            jsonb default '[]'::jsonb,
  is_reference        boolean default false,
  created_at          timestamptz default now()
);

create table if not exists public.chemical_usage_logs (
  id              uuid primary key default gen_random_uuid(),
  chemical_id     uuid references public.chemicals(id) on delete cascade,
  chemical_code   text,
  qty             numeric,
  unit            text,
  sample_code     text,
  method          text,
  technician      text,
  used_at         timestamptz,
  created_at      timestamptz default now()
);

-- =========================================================
-- 6. TEST REQUESTS (Phiếu yêu cầu thử nghiệm)
-- =========================================================
create table if not exists public.test_requests (
  id                      uuid primary key default gen_random_uuid(),
  code                    text unique not null,
  customer_id             uuid references public.customers(id) on delete set null,
  customer                text, -- denormalized
  customer_code           text,
  contact                 text,
  phone                   text,
  matrix                  text,
  expected_samples        integer,
  criteria                jsonb default '[]'::jsonb, -- [{name, method, unitPrice}]
  purpose                 text,
  decision_rule           text,
  expected_delivery_days  integer,
  vat_rate                integer default 0,
  notes                   text,
  status                  text default 'Yêu cầu mới',
  contract_code           text,
  linked_sample_codes     jsonb default '[]'::jsonb,
  created_at              timestamptz default now(),
  quoted_at               timestamptz,
  accepted_at             timestamptz
);

-- =========================================================
-- 7. SAMPLES (mẫu đã tiếp nhận)
-- =========================================================
create table if not exists public.samples (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  customer_id   uuid references public.customers(id) on delete set null,
  customer      text, -- denormalized
  type          text,
  received_at   date,
  due_at        date,
  technician    text,
  status        text default 'Đã tiếp nhận',
  progress      integer default 0,
  criteria      jsonb default '[]'::jsonb, -- list of criterion names
  created_at    timestamptz default now()
);

-- =========================================================
-- 8. ARCHIVED SAMPLES (mẫu lưu)
-- =========================================================
create table if not exists public.archived_samples (
  id                    uuid primary key default gen_random_uuid(),
  archive_code          text unique not null,
  original_sample_code  text,
  customer              text,
  type                  text,
  archived_at           date,
  expiry_at             date,
  location              text,
  storage_condition     text,
  amount                text,
  status                text default 'Đang lưu',
  qc_analysis_at        date,
  qc_note               text,
  purpose               text,
  created_at            timestamptz default now()
);

-- =========================================================
-- 9. ANALYSIS RESULTS + replicates + raw files + audit + approvals
-- =========================================================
create table if not exists public.analysis_results (
  id                          uuid primary key default gen_random_uuid(),
  result_code                 text unique not null,
  sample_code                 text,
  customer_name               text,
  matrix                      text,
  criterion                   text,
  unit                        text,
  method                      text,
  instrument_code             text,
  instrument_name             text,
  reference_material          text,
  technician                  text,
  started_at                  timestamptz,
  finished_at                 timestamptz,
  replicates                  jsonb default '[]'::jsonb, -- [{id, value, note}]
  mean                        numeric,
  sd                          numeric,
  rsd                         numeric,
  uncertainty                 numeric,
  matrix_spike_recovery       numeric,
  blank_value                 numeric,
  decision_rule_id            text,
  decision_rule_type          text,
  decision_limit              numeric,
  acceptance_upper            numeric,
  rejection_upper             numeric,
  conclusion                  text, -- Đạt | Không đạt | Vô định | Báo cáo giá trị
  conclusion_explanation      text,
  raw_files                   jsonb default '[]'::jsonb,
  approvals                   jsonb default '[]'::jsonb,
  status                      text default 'Đang nhập',
  qa_comment                  text,
  manager_comment             text,
  created_at                  timestamptz default now()
);

create table if not exists public.analysis_audit_events (
  id          uuid primary key default gen_random_uuid(),
  result_id   uuid references public.analysis_results(id) on delete cascade,
  at          timestamptz default now(),
  actor       text,
  action      text,
  detail      text,
  field       text,
  old_value   text,
  new_value   text
);

-- =========================================================
-- 10. QC: Levey-Jennings + Westgard + External QC
-- =========================================================
create table if not exists public.qc_charts (
  id                  uuid primary key default gen_random_uuid(),
  criterion           text not null,
  matrix              text,
  method              text,
  unit                text,
  mean                numeric,
  sd                  numeric,
  reference_material  text,
  created_at          timestamptz default now()
);

create table if not exists public.qc_points (
  id          uuid primary key default gen_random_uuid(),
  chart_id    uuid references public.qc_charts(id) on delete cascade,
  date        date,
  value       numeric,
  technician  text
);

create table if not exists public.external_qc_rounds (
  id          uuid primary key default gen_random_uuid(),
  type        text, -- Thử nghiệm thành thạo | So sánh liên phòng
  provider    text,
  round       text,
  criterion   text,
  z           numeric,
  verdict     text, -- Đạt | Cảnh báo | Không đạt
  closed_at   date
);

-- =========================================================
-- 11. RISKS + opportunities (§8.5)
-- =========================================================
create table if not exists public.risks (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,
  category              text,
  title                 text not null,
  cause                 text,
  effect                text,
  likelihood            smallint check (likelihood between 1 and 5),
  impact                smallint check (impact between 1 and 5),
  controls              text,
  treatment             text, -- Né tránh | Giảm thiểu | Chuyển giao | Chấp nhận
  action                text,
  owner                 text,
  review_at             date,
  residual_likelihood   smallint,
  residual_impact       smallint,
  status                text default 'Mở',
  iso_clause            text,
  created_at            timestamptz default now()
);

create table if not exists public.opportunities (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  expected_benefit    text,
  owner               text,
  status              text default 'Đề xuất'
);

-- =========================================================
-- 12. DECISION RULES (§7.8.6)
-- =========================================================
create table if not exists public.decision_rules (
  id                  uuid primary key default gen_random_uuid(),
  criterion           text not null,
  matrix              text,
  method              text,
  unit                text,
  limit_value         numeric,
  limit_direction     text, -- max | min | range
  limit_min           numeric,
  limit_source        text,
  uncertainty         numeric,
  rule_type           text,
  acceptance_upper    numeric,
  acceptance_lower    numeric,
  rejection_upper     numeric,
  rejection_lower     numeric,
  notes               text,
  approved_by         text,
  approved_at         date
);

-- =========================================================
-- 13. CAMPAIGNS (quan trắc theo đợt)
-- =========================================================
create table if not exists public.campaigns (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,
  name                  text not null,
  scope                 text,
  area                  text,
  client                text,
  funding_source        text,
  purpose               text,
  matrix                jsonb default '[]'::jsonb,
  criteria              jsonb default '[]'::jsonb,
  planned_points        integer default 0,
  collected_samples     integer default 0,
  analyzed_samples      integer default 0,
  start_date            date,
  end_date              date,
  status                text default 'Lập kế hoạch',
  leader                text,
  report_code           text,
  report_published_at   date,
  exceedance_count      integer,
  points                jsonb default '[]'::jsonb,
  trend                 jsonb default '[]'::jsonb,
  created_at            timestamptz default now()
);

-- =========================================================
-- 14. FIELD SAMPLING (lấy mẫu hiện trường) – sampling sessions + field samples
-- =========================================================
create table if not exists public.sampling_sessions (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  name                text,
  area                text,
  leader              text,
  team                jsonb default '[]'::jsonb,
  vehicle             text,
  started_at          timestamptz,
  ended_at            timestamptz,
  customer            text,
  matrix              jsonb default '[]'::jsonb,
  status              text default 'Đang chuẩn bị',
  planned_samples     integer,
  collected_samples   integer default 0,
  synced_samples      integer default 0
);

create table if not exists public.field_samples (
  id                    uuid primary key default gen_random_uuid(),
  field_code            text unique not null,
  session_code          text,
  matrix                text,
  collector_name        text,
  collected_at          timestamptz,
  lat                   numeric,
  lng                   numeric,
  address               text,
  depth                 text,
  amount                text,
  container             text,
  preservation          text,
  on_site_readings      jsonb default '[]'::jsonb,
  photos                integer default 0,
  has_signature         boolean default false,
  status                text default 'Đang thu',
  linked_sample_code    text,
  notes                 text
);

-- =========================================================
-- 15. SERVICES catalog (Dịch vụ + Tư vấn – III. THỊ TRƯỜNG)
-- =========================================================
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  name            text not null,
  group_name      text not null, -- Phân tích đất | nước | phân bón | BVTV | Tư vấn nông nghiệp
  description     text,
  unit            text,
  base_price      bigint default 0, -- VND
  turnaround      text,
  methods         jsonb default '[]'::jsonb,
  vilas           boolean default false
);

-- =========================================================
-- 16. CUSTOMER FEEDBACK (Phiếu thu thập ý kiến – AEMD-BM-08.01)
-- =========================================================
create table if not exists public.customer_feedback (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  customer_name       text,
  customer_kind       text,
  submitted_at        date,
  service_attitude    text, -- Nhiệt tình | Tốt | Bình thường | Kém
  fee                 text, -- Cao | Hợp lý | Thấp
  quality             text,
  info_availability   text,
  delivery_time       text,
  comments            text,
  is_complaint        boolean default false,
  complaint_status    text,
  response_date       date,
  responder           text,
  response_note       text,
  created_at          timestamptz default now()
);

-- =========================================================
-- INDEXES
-- =========================================================
create index if not exists idx_samples_status on public.samples(status);
create index if not exists idx_test_requests_status on public.test_requests(status);
create index if not exists idx_analysis_results_status on public.analysis_results(status);
create index if not exists idx_risks_status on public.risks(status);
create index if not exists idx_customers_kind on public.customers(kind);
