-- 0019: M4 đợt 4 – kho tri thức số & dữ liệu nền (M4.5), tài sản trí tuệ, hợp tác, chuyển giao, tập huấn (M4.6).
-- Quy ước: docs/database-conventions.md.

-- Tìm kiếm toàn văn không phân biệt dấu: unaccent + cấu hình 'simple' (Postgres không có từ điển tiếng Việt).
create extension if not exists unaccent;
create or replace function m4.f_unaccent(text) returns text
  language sql immutable parallel safe strict
  as $$ select public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- ─────────────────────── M4.5 Kho tri thức ───────────────────────
create table if not exists m4.knowledge_items (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,               -- TT-2026-001
  kind              text default 'Quy trình kỹ thuật',  -- Kết quả đề tài | Số liệu thí nghiệm | Quy trình kỹ thuật | Báo cáo tổng kết | Tiêu chuẩn – quy chuẩn | Phương pháp nghiên cứu | Bài báo khoa học | Sách – tài liệu | Khác
  title             text not null,
  abstract          text,                               -- tóm tắt
  content           text,                               -- nội dung toàn văn (dán văn bản) để tìm kiếm
  keywords          text,
  external_authors  text,                               -- tác giả ngoài Viện
  task_id           uuid references m4.research_tasks(id) on delete set null,
  field_trial_id    uuid references m4.field_trials(id) on delete set null,
  published_at      date,
  source            text,                               -- tạp chí, hội thảo, số hiệu tiêu chuẩn…
  url               text,                               -- tệp gốc (https://…)
  is_public         boolean default false,              -- công bố trên cổng công khai
  note              text,
  created_at        timestamptz default now(),
  search tsvector generated always as (
    setweight(to_tsvector('simple', m4.f_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('simple', m4.f_unaccent(coalesce(keywords, '') || ' ' || coalesce(external_authors, '') || ' ' || coalesce(source, ''))), 'B') ||
    setweight(to_tsvector('simple', m4.f_unaccent(coalesce(abstract, '') || ' ' || coalesce(content, ''))), 'C')
  ) stored
);
create index if not exists idx_knowledge_items_search on m4.knowledge_items using gin (search);
create index if not exists idx_knowledge_items_task_id on m4.knowledge_items(task_id);

-- Tác giả trong Viện (liên kết lý lịch khoa học)
create table if not exists m4.knowledge_authors (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid not null references m4.knowledge_items(id) on delete cascade,
  researcher_id  uuid not null references m4.researchers(id) on delete cascade,
  role           text default 'Tác giả',             -- Tác giả chính | Tác giả | Đồng tác giả
  created_at     timestamptz default now(),
  unique (item_id, researcher_id)
);

-- Dữ liệu nền: danh mục bộ dữ liệu + số liệu (chuỗi theo địa bàn – kỳ – chỉ tiêu)
create table if not exists m4.base_datasets (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,             -- DLN-KH-01
  theme             text default 'Khí hậu',           -- Đất đai | Khí hậu | Thủy văn | Cơ cấu cây trồng | Cơ cấu vật nuôi | Hạ tầng nghiên cứu
  title             text not null,
  area              text,                             -- địa bàn
  period            text,                             -- thời kỳ, VD 2015–2025
  source            text,                             -- Cục Thống kê, Đài KTTV…
  update_frequency  text,                             -- Hằng tháng | Hằng năm | Một lần
  url               text,
  description       text,
  note              text,
  created_at        timestamptz default now()
);

create table if not exists m4.base_observations (
  id          uuid primary key default gen_random_uuid(),
  dataset_id  uuid not null references m4.base_datasets(id) on delete cascade,
  location    text not null default '',               -- xã / huyện / trạm
  period      text not null,                          -- YYYY hoặc YYYY-MM
  indicator   text not null,                          -- chỉ tiêu, VD Lượng mưa
  value       double precision,
  unit        text,
  created_at  timestamptz default now(),
  unique (dataset_id, location, period, indicator)
);
create index if not exists idx_base_observations_dataset on m4.base_observations(dataset_id, indicator, period);

-- ─────────────────────── M4.6 Tài sản trí tuệ, hợp tác, chuyển giao ───────────────────────
create table if not exists m4.ip_assets (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,               -- SHTT-001
  kind            text default 'Bằng bảo hộ giống cây trồng', -- Sáng chế | Giải pháp hữu ích | Kiểu dáng công nghiệp | Nhãn hiệu | Chỉ dẫn địa lý | Bằng bảo hộ giống cây trồng | Quyền tác giả
  title           text not null,
  owner           text,                               -- chủ sở hữu
  authors         text,                               -- tác giả
  task_id         uuid references m4.research_tasks(id) on delete set null,
  application_no  text,                               -- số đơn
  filed_at        date,
  grant_no        text,                               -- số văn bằng
  granted_at      date,
  expires_at      date,
  status          text default 'Đang soạn hồ sơ',     -- Đang soạn hồ sơ | Đã nộp đơn | Đang thẩm định | Được cấp bằng | Bị từ chối | Hết hiệu lực
  note            text,
  created_at      timestamptz default now()
);

create table if not exists m4.partners (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                   -- DT-001
  name        text not null,
  kind        text default 'Doanh nghiệp',            -- Doanh nghiệp | Viện – Trường | Cơ quan nhà nước | Hợp tác xã | Tổ chức quốc tế | Khác
  country     text default 'Việt Nam',
  contact     text,
  email       text,
  phone       text,
  address     text,
  note        text,
  created_at  timestamptz default now()
);

create table if not exists m4.agreements (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                  -- TTHT-2026-001
  partner_id   uuid references m4.partners(id) on delete set null,
  kind         text default 'Thỏa thuận hợp tác',     -- Biên bản ghi nhớ (MOU) | Thỏa thuận hợp tác | Chương trình hợp tác | Hợp đồng nghiên cứu
  title        text not null,
  scope        text,
  signed_at    date,
  valid_until  date,
  status       text default 'Đang hiệu lực',          -- Đang đàm phán | Đang hiệu lực | Hết hạn | Chấm dứt
  url          text,
  note         text,
  created_at   timestamptz default now()
);

create table if not exists m4.tech_transfers (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,                -- CG-2026-001
  title          text not null,                       -- công nghệ / quy trình / giống chuyển giao
  partner_id     uuid references m4.partners(id) on delete set null,
  ip_asset_id    uuid references m4.ip_assets(id) on delete set null,
  task_id        uuid references m4.research_tasks(id) on delete set null,
  form           text default 'Chuyển giao quyền sử dụng', -- Chuyển nhượng quyền sở hữu | Chuyển giao quyền sử dụng | Chuyển giao kèm đào tạo, hỗ trợ kỹ thuật
  contract_no    text,
  signed_at      date,
  value          double precision default 0,          -- VND
  handover_at    date,                                -- ngày biên bản bàn giao
  handover_note  text,                                -- nội dung biên bản bàn giao
  status         text default 'Đang đàm phán',        -- Đang đàm phán | Đã ký | Đã bàn giao | Đã thanh lý | Hủy
  note           text,
  created_at     timestamptz default now()
);

create table if not exists m4.trainings (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,                -- TH-2026-001
  title          text not null,
  transfer_id    uuid references m4.tech_transfers(id) on delete set null,
  mode           text default 'Trực tuyến',           -- Trực tuyến | Trực tiếp | Kết hợp
  audience       text,                                -- nông dân, cán bộ khuyến nông, doanh nghiệp…
  start_at       date,
  end_at         date,
  venue          text,                                -- địa điểm / nền tảng trực tuyến
  equipment      text,                                -- thiết bị sử dụng (Khoản mục I.2)
  meeting_url    text,
  trainer        text,
  planned        integer default 0,                   -- số học viên dự kiến
  attended       integer default 0,                   -- số học viên tham dự
  materials_url  text,
  status         text default 'Kế hoạch',             -- Kế hoạch | Đang mở đăng ký | Đã tổ chức | Hủy
  note           text,
  created_at     timestamptz default now()
);
