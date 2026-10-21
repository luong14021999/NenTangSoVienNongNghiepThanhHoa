-- 0014: Nền tảng dùng chung M1 – xác thực 2 lớp, danh mục dùng chung (MDM), API & tích hợp LGSP/NDXP,
-- cấu hình hệ thống, giám sát sức khỏe, sao lưu, kho dữ liệu (schema analytics).

-- M1.1 Xác thực 2 lớp (TOTP). secret_enc: khóa bí mật mã hóa AES-256-GCM; recovery_hashes: SHA-256 mã khôi phục.
create table if not exists public.user_mfa (
  email            text primary key,
  user_id          text,
  secret_enc       text not null,
  enabled          boolean default false,
  last_counter     bigint default -1,
  recovery_hashes  text[] default '{}',
  enrolled_at      timestamptz,
  last_used_at     timestamptz,
  created_at       timestamptz default now()
);

-- M1.1 / M1.7 Sự kiện xác thực (xác thực 2 lớp đạt / sai, đăng ký, gỡ, đặt lại)
create table if not exists public.auth_events (
  id          bigserial primary key,
  at          timestamptz default now(),
  email       text,
  event       text not null,
  ip          text,
  user_agent  text,
  detail      text
);
create index if not exists idx_auth_events_at on public.auth_events(at desc);
create index if not exists idx_auth_events_email on public.auth_events(lower(email), at desc);

-- M1.2 Danh mục dùng chung
create table if not exists public.mdm_catalogs (
  code         text primary key,
  name         text not null,
  description  text,
  owner        text,
  source       text,
  updated_at   timestamptz default now()
);
create table if not exists public.mdm_items (
  id            uuid primary key default gen_random_uuid(),
  catalog_code  text not null references public.mdm_catalogs(code) on delete cascade,
  code          text not null,
  name          text not null,
  name_en       text,
  parent_code   text,
  attrs         jsonb default '{}'::jsonb,
  status        text default 'Hiệu lực', -- Hiệu lực | Ngừng sử dụng
  version       integer default 1,
  valid_from    date default current_date,
  updated_by    text,
  updated_at    timestamptz default now(),
  unique (catalog_code, code)
);
create index if not exists idx_mdm_items_catalog on public.mdm_items(catalog_code, code);

-- M1.3 Khách hàng API (hệ thống bên ngoài) – chỉ lưu mã băm khóa
create table if not exists public.api_clients (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  organization   text,
  key_prefix     text not null,
  key_hash       text not null unique,
  scopes         text[] not null default '{}',
  rate_limit     integer default 60, -- lượt / phút; 0 = không giới hạn
  active         boolean default true,
  expires_at     date,
  note           text,
  created_by     text,
  created_at     timestamptz default now(),
  last_used_at   timestamptz
);
create table if not exists public.api_calls (
  id           bigserial primary key,
  at           timestamptz default now(),
  client_id    uuid,
  client_name  text,
  method       text,
  path         text,
  status       integer,
  ms           integer,
  ip           text
);
create index if not exists idx_api_calls_at on public.api_calls(at desc);
create index if not exists idx_api_calls_client on public.api_calls(client_id, at desc);

-- M1.3 Thông điệp trao đổi qua LGSP / NDXP (ra / vào). Chế độ mô phỏng khi chưa cấu hình kết nối thật.
create table if not exists public.integration_messages (
  id              uuid primary key default gen_random_uuid(),
  at              timestamptz default now(),
  direction       text not null, -- Gửi đi | Nhận về
  channel         text not null, -- LGSP | NDXP
  service         text not null,
  correlation_id  text,
  payload         jsonb,
  status          text,          -- Thành công | Lỗi | Đang chờ
  response        jsonb,
  attempts        integer default 1,
  error           text,
  mode            text,          -- Mô phỏng | Thật
  actor           text
);
create index if not exists idx_integration_messages_at on public.integration_messages(at desc);

-- M1.8 Cấu hình hệ thống
create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  text,
  updated_at  timestamptz default now()
);
insert into public.system_settings (key, value) values
  ('mfa_required', 'false'::jsonb),
  ('mfa_trust_hours', '12'::jsonb),
  ('api_default_rate_limit', '60'::jsonb),
  ('backup_retention_days', '30'::jsonb),
  ('maintenance_banner', '""'::jsonb)
on conflict (key) do nothing;

-- M1.8 Giám sát sức khỏe & sao lưu
create table if not exists public.health_checks (
  id       bigserial primary key,
  at       timestamptz default now(),
  ok       boolean,
  db_ms    integer,
  source   text,  -- Tự động (cron) | Thủ công
  detail   jsonb
);
create index if not exists idx_health_checks_at on public.health_checks(at desc);
create table if not exists public.backup_runs (
  id          bigserial primary key,
  at          timestamptz default now(),
  kind        text,   -- Xuất dữ liệu JSON | Điểm khôi phục Neon
  actor       text,
  tables      integer,
  rows        integer,
  bytes       integer,
  sha256      text,
  note        text
);

-- M1.4 Kho dữ liệu dùng chung: lớp view phân tích, đọc từ dữ liệu nghiệp vụ, không ghi.
create schema if not exists analytics;

create or replace view analytics.fact_samples as
with first_issue as (
  select sample_code, min(issued_at) issued_at from public.test_reports group by sample_code
)
select s.code, s.customer, s.type, s.received_at, s.due_at, s.status, s.technician,
       jsonb_array_length(coalesce(s.criteria, '[]'::jsonb)) criteria_count,
       f.issued_at first_issued_at,
       case when f.issued_at is not null then ((f.issued_at at time zone 'Asia/Ho_Chi_Minh')::date - s.received_at) end tat_days,
       case when f.issued_at is null then null
            when s.due_at is null then true
            else (f.issued_at at time zone 'Asia/Ho_Chi_Minh')::date <= s.due_at end on_time
from public.samples s left join first_issue f on f.sample_code = s.code;

create or replace view analytics.fact_reports as
select code, sample_code, revision, replaces_code, status, issued_at, issued_by, revoked_at, revoked_by, revoke_reason
from public.test_reports;

create or replace view analytics.fact_results as
select result_code, sample_code, customer_name, matrix, criterion, unit, method, technician,
       started_at, finished_at, mean, sd, rsd, uncertainty, conclusion, status
from public.analysis_results;

create or replace view analytics.fact_revenue as
select r.code, r.customer, r.status, r.matrix, r.expected_samples, r.vat_rate,
       coalesce(r.accepted_at, r.created_at) as at,
       to_char(coalesce(r.accepted_at, r.created_at) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') as month,
       p.unit_total * greatest(coalesce(r.expected_samples, 0), 0) as net,
       round(p.unit_total * greatest(coalesce(r.expected_samples, 0), 0) * coalesce(r.vat_rate, 0) / 100.0) as vat,
       p.unit_total * greatest(coalesce(r.expected_samples, 0), 0)
         + round(p.unit_total * greatest(coalesce(r.expected_samples, 0), 0) * coalesce(r.vat_rate, 0) / 100.0) as total
from public.test_requests r
cross join lateral (
  select coalesce(sum(nullif(c->>'unitPrice', '')::numeric), 0) as unit_total
  from jsonb_array_elements(coalesce(r.criteria, '[]'::jsonb)) c
) p;

create or replace view analytics.dim_customers as
select code, name, kind, address, samples_ytd, last_sample_at from public.customers;

create or replace view analytics.fact_equipment as
select code, name, model, location, status, last_calibration, next_calibration,
       next_calibration - (now() at time zone 'Asia/Ho_Chi_Minh')::date days_to_calibration
from public.equipment;

create or replace view analytics.fact_chemicals as
select code, name, unit, stock, min_stock, expiry, is_reference,
       (min_stock > 0 and stock < min_stock) low_stock,
       expiry - (now() at time zone 'Asia/Ho_Chi_Minh')::date days_to_expiry
from public.chemicals;

create or replace view analytics.fact_nonconformities as
select code, detected_at, source, clause, severity, status, owner, due_at, closed_at
from public.nonconformities;

create or replace view analytics.fact_feedback as
select code, customer_name, customer_kind, submitted_at, service_attitude, fee, quality,
       info_availability, delivery_time, is_complaint, complaint_status
from public.customer_feedback;
