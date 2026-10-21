-- 0022: M3.2 đợt C – hồ sơ pháp lý giống (M3.2.1), nguồn giống gốc & phả hệ (M3.2.2),
-- bộ chỉ tiêu, khảo nghiệm, kiểm định, chứng nhận lô giống (M3.2.3), sản xuất giống theo cấp & cung ứng (M3.2.6).
-- Quy ước: docs/database-conventions.md.

-- ── M3.2.1 Hồ sơ pháp lý giống ──────────────────────────────────────
alter table m3_breed.varieties add column if not exists scope            text default 'Giống của Viện'; -- Giống của Viện | Giống trên địa bàn tỉnh
alter table m3_breed.varieties add column if not exists circulation_type text default 'Chưa lưu hành';  -- Công nhận lưu hành | Tự công bố lưu hành | Lưu hành đặc cách | Chưa lưu hành
alter table m3_breed.varieties add column if not exists circulation_no   text;
alter table m3_breed.varieties add column if not exists circulation_at   date;
alter table m3_breed.varieties add column if not exists ip_asset_id      uuid references m4.ip_assets(id) on delete set null; -- văn bằng bảo hộ (M4.6)
alter table m3_breed.varieties add column if not exists regions          text;                          -- vùng / địa phương khuyến cáo
alter table m3_breed.varieties add column if not exists area_ha          double precision default 0;    -- diện tích / quy mô trên địa bàn tỉnh

create table if not exists m3_breed.variety_documents (
  id           uuid primary key default gen_random_uuid(),
  variety_id   uuid not null references m3_breed.varieties(id) on delete cascade,
  kind         text default 'Quyết định công nhận',  -- Quyết định công nhận | Quyết định lưu hành | Bản tự công bố lưu hành | Văn bằng bảo hộ | Giấy chứng nhận hợp quy | Hồ sơ khảo nghiệm | Khác
  number       text,
  issued_at    date,
  issuer       text,
  valid_until  date,
  url          text,
  note         text,
  created_at   timestamptz default now()
);
create index if not exists idx_variety_documents_variety on m3_breed.variety_documents(variety_id);

-- ── M3.2.2 Nguồn giống gốc, phả hệ, chọn lọc ───────────────────────
create table if not exists m3_breed.source_stocks (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,               -- NG-CDD-001
  variety_id      uuid references m3_breed.varieties(id) on delete set null,
  kind            text default 'Cây đầu dòng',        -- Cây đầu dòng | Vườn cây đầu dòng | Đàn giống gốc | Đàn ông bà | Đàn bố mẹ | Đàn hậu bị
  name            text not null,
  location        text,
  quantity        integer default 0,                  -- số cây / con
  recognition_no  text,                               -- QĐ công nhận cây / vườn đầu dòng, đàn giống
  recognized_at   date,
  valid_until     date,
  status          text default 'Đang khai thác',      -- Đang khai thác | Tạm dừng | Loại bỏ
  note            text,
  created_at      timestamptz default now()
);

create table if not exists m3_breed.individuals (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                   -- số tai / số hiệu cây
  stock_id    uuid references m3_breed.source_stocks(id) on delete set null,
  variety_id  uuid references m3_breed.varieties(id) on delete set null,
  sex         text default '—',                       -- Đực | Cái | —
  born_at     date,
  sire_id     uuid references m3_breed.individuals(id) on delete set null, -- bố
  dam_id      uuid references m3_breed.individuals(id) on delete set null, -- mẹ
  generation  text,                                   -- VD: G0, F1, thế hệ chọn lọc 3
  status      text default 'Đang sử dụng',            -- Đang sử dụng | Loại thải | Chết | Xuất bán
  note        text,
  created_at  timestamptz default now()
);
create index if not exists idx_individuals_stock on m3_breed.individuals(stock_id);

create table if not exists m3_breed.selection_records (
  id             uuid primary key default gen_random_uuid(),
  individual_id  uuid references m3_breed.individuals(id) on delete cascade,
  stock_id       uuid references m3_breed.source_stocks(id) on delete cascade,
  measured_at    date default current_date,
  criterion      text not null,                       -- chỉ tiêu chọn lọc
  value          double precision,
  unit           text,
  decision       text default 'Theo dõi',             -- Chọn | Loại | Theo dõi
  note           text,
  created_at     timestamptz default now()
);
create index if not exists idx_selection_records_individual on m3_breed.selection_records(individual_id);

-- ── M3.2.3 Bộ chỉ tiêu, khảo nghiệm, kiểm định, chứng nhận ──────────
create table if not exists m3_breed.standards (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                   -- số hiệu quy chuẩn / tiêu chuẩn (Viện nhập)
  name        text not null,
  kind        text default 'Chất lượng hạt giống',    -- Khảo nghiệm VCU | Khảo nghiệm DUS | Chất lượng hạt giống | Chất lượng cây giống | Giống vật nuôi | Giống thủy sản
  species     text,
  level       text,                                   -- áp dụng cho cấp giống (nếu có)
  valid_from  date,
  note        text,
  created_at  timestamptz default now()
);

create table if not exists m3_breed.standard_criteria (
  id           uuid primary key default gen_random_uuid(),
  standard_id  uuid not null references m3_breed.standards(id) on delete cascade,
  criterion    text not null,                         -- trùng tên chỉ tiêu M2 để tự đối chiếu
  unit         text,
  min_value    double precision,                      -- trống = không giới hạn dưới
  max_value    double precision,                      -- trống = không giới hạn trên
  method       text,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);
create index if not exists idx_standard_criteria_standard on m3_breed.standard_criteria(standard_id);

alter table m3_breed.trials add column if not exists standard_id uuid references m3_breed.standards(id) on delete set null;

create table if not exists m3_breed.trial_observations (
  id          uuid primary key default gen_random_uuid(),
  trial_id    uuid not null references m3_breed.trials(id) on delete cascade,
  criterion   text not null,
  value       double precision,
  unit        text,
  note        text,
  created_at  timestamptz default now()
);
create index if not exists idx_trial_observations_trial on m3_breed.trial_observations(trial_id);

-- ── M3.2.6 Sản xuất giống theo cấp ─────────────────────────────────
create table if not exists m3_breed.production_lots (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,           -- SX-2026-001
  variety_id          uuid references m3_breed.varieties(id) on delete set null,
  level               text not null,                  -- cấp giống sản xuất ra
  source_seed_lot_id  uuid,                           -- lô giống cấp trên dùng làm nguồn (khóa ngoại thêm sau)
  source_stock_id     uuid references m3_breed.source_stocks(id) on delete set null, -- hoặc nguồn giống gốc
  facility            text,                           -- cơ sở sản xuất
  season              text,
  scale               double precision default 0,     -- quy mô: ha / số con bố mẹ
  scale_unit          text default 'ha',
  planned_qty         double precision default 0,
  actual_qty          double precision default 0,
  unit                text default 'kg',              -- kg | cây | con
  survival_pct        double precision,
  started_at          date,
  harvested_at        date,
  cost_total          double precision default 0,     -- VND
  status              text default 'Kế hoạch',        -- Kế hoạch | Đang sản xuất | Đã thu hoạch | Hủy
  note                text,
  created_at          timestamptz default now()
);

create table if not exists m3_breed.production_logs (
  id          uuid primary key default gen_random_uuid(),
  lot_id      uuid not null references m3_breed.production_lots(id) on delete cascade,
  logged_at   date default current_date,
  activity    text default 'Chăm sóc',                -- Gieo – cấy | Bón phân | Phòng trừ dịch hại | Khử lẫn | Chăm sóc | Tiêm phòng | Thu hoạch | Khác
  detail      text not null,
  cost        double precision default 0,
  actor       text,
  created_at  timestamptz default now()
);
create index if not exists idx_production_logs_lot on m3_breed.production_logs(lot_id, logged_at desc);

-- Lô giống (đơn vị kiểm định, chứng nhận, cung ứng, truy xuất QR)
create table if not exists m3_breed.seed_lots (
  id                     uuid primary key default gen_random_uuid(),
  code                   text unique not null,        -- LG-2026-001 (in trên bao bì / tem QR)
  variety_id             uuid references m3_breed.varieties(id) on delete set null,
  level                  text not null,
  production_lot_id      uuid references m3_breed.production_lots(id) on delete set null,
  quantity               double precision default 0,
  unit                   text default 'kg',
  produced_at            date,
  standard_id            uuid references m3_breed.standards(id) on delete set null,
  sample_code            text,                        -- mã mẫu kiểm nghiệm tại M2
  field_inspected_at     date,                        -- kiểm định ruộng giống / đàn giống
  field_result           text default 'Chưa kiểm định', -- Chưa kiểm định | Đạt | Không đạt
  certificate_no         text,                        -- số giấy chứng nhận chất lượng lô giống
  certified_at           date,
  conformity_no          text,                        -- số giấy chứng nhận / công bố hợp quy
  conformity_until       date,
  status                 text default 'Chờ kiểm định', -- Chờ kiểm định | Đạt | Không đạt | Đã chứng nhận | Hết hiệu lực
  note                   text,
  created_at             timestamptz default now()
);
create index if not exists idx_seed_lots_production on m3_breed.seed_lots(production_lot_id);

alter table m3_breed.production_lots drop constraint if exists production_lots_source_seed_lot_fk;
alter table m3_breed.production_lots add constraint production_lots_source_seed_lot_fk
  foreign key (source_seed_lot_id) references m3_breed.seed_lots(id) on delete set null;

-- ── M3.2.6 Nhu cầu, đơn hàng, giao nhận ────────────────────────────
create table if not exists m3_breed.demands (
  id          uuid primary key default gen_random_uuid(),
  area        text not null,                          -- huyện / xã / HTX
  season      text not null,                          -- vụ, VD Vụ Xuân 2027
  variety_id  uuid references m3_breed.varieties(id) on delete set null,
  species     text,
  quantity    double precision default 0,
  unit        text default 'kg',
  source      text,                                   -- Sở NN&MT, đăng ký HTX, khảo sát…
  note        text,
  created_at  timestamptz default now()
);

create table if not exists m3_breed.orders (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                  -- DHG-2026-001
  customer_id  uuid references public.customers(id) on delete set null,
  variety_id   uuid references m3_breed.varieties(id) on delete set null,
  level        text,
  quantity     double precision default 0,
  unit         text default 'kg',
  due_at       date,
  season       text,
  unit_price   double precision default 0,            -- VND / đơn vị
  status       text default 'Mới',                    -- Mới | Đã xác nhận | Giao một phần | Hoàn thành | Hủy
  note         text,
  created_at   timestamptz default now()
);

create table if not exists m3_breed.deliveries (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                 -- GN-2026-001
  order_id      uuid references m3_breed.orders(id) on delete set null,
  seed_lot_id   uuid not null references m3_breed.seed_lots(id) on delete restrict,
  delivered_at  date default current_date,
  quantity      double precision not null default 0,
  receiver      text,
  note          text,
  created_at    timestamptz default now()
);
create index if not exists idx_deliveries_seed_lot on m3_breed.deliveries(seed_lot_id);
