-- 0020: M3.1 đợt A – cây mẹ & hồ sơ nguồn giống (M3.1.1), lô môi trường & định mức hóa chất (M3.1.2),
-- mẻ cấy theo giai đoạn: mẻ cha – con, hệ số nhân, tỷ lệ sống (M3.1.3), tủ cấy, phòng nuôi & số liệu thiết bị đo (M3.1.4).
-- Quy ước: docs/database-conventions.md.

-- M3.1.1 Cây mẹ / hồ sơ nguồn giống
create table if not exists m3_tissue.mother_plants (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,            -- CM-001
  species            text not null,
  variety            text,
  germplasm_id       uuid references m3_breed.germplasm(id) on delete set null, -- tham chiếu mã nguồn gen (M3.2)
  origin             text,                             -- nguồn gốc cây mẹ (vườn đầu dòng, nhập nội…)
  location           text,                             -- vườn / nhà lưới lưu giữ
  planted_at         date,
  selection_criteria text,                             -- tiêu chí chọn cây mẹ
  disease_status     text default 'Chưa kiểm tra',    -- Chưa kiểm tra | Sạch bệnh | Nhiễm bệnh
  disease_tested_at  date,
  disease_method     text,                             -- ELISA | PCR | RT-PCR | Quan sát triệu chứng | Khác
  pathogens          text,                             -- tác nhân đã kiểm tra (VD: BBTV, CMV)
  disease_ref        text,                             -- mã mẫu M2 / số phiếu kết quả
  status             text default 'Đang sử dụng',      -- Đang sử dụng | Tạm dừng | Loại bỏ
  note               text,
  created_at         timestamptz default now()
);
alter table m3_tissue.materials add column if not exists mother_plant_id uuid references m3_tissue.mother_plants(id) on delete set null;
create index if not exists idx_materials_mother_plant_id on m3_tissue.materials(mother_plant_id);

-- M3.1.2 Định mức hóa chất của công thức (trên 1 lít môi trường)
create table if not exists m3_tissue.recipe_chemicals (
  id             uuid primary key default gen_random_uuid(),
  recipe_id      uuid not null references m3_tissue.media_recipes(id) on delete cascade,
  chemical       text not null,                       -- tên hóa chất
  chemical_code  text,                                -- mã hóa chất trong kho (M2) nếu có
  amount_per_l   double precision default 0,
  unit           text default 'mg',                   -- mg | g | ml | µl
  note           text,
  created_at     timestamptz default now()
);
create index if not exists idx_recipe_chemicals_recipe_id on m3_tissue.recipe_chemicals(recipe_id);

-- M3.1.2 Lô môi trường: pha chế, hấp tiệt trùng, kiểm tra chất lượng
create table if not exists m3_tissue.media_batches (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,             -- LMT-2026-001
  recipe_id         uuid references m3_tissue.media_recipes(id) on delete set null,
  prepared_at       date,
  prepared_by       text,
  volume_l          double precision default 0,
  vessels           integer default 0,                -- số bình / ống đã rót
  ph_measured       double precision,
  autoclave_temp_c  double precision,                 -- VD 121
  autoclave_minutes double precision,                 -- VD 20
  autoclave_at      timestamptz,
  qc_result         text default 'Chờ kiểm tra',      -- Chờ kiểm tra | Đạt | Không đạt
  qc_note           text,                             -- VD: ủ 3 ngày không nhiễm, gel đông tốt
  expires_at        date,
  note              text,
  created_at        timestamptz default now()
);
create index if not exists idx_media_batches_recipe_id on m3_tissue.media_batches(recipe_id);

-- M3.1.4 Tủ cấy vô trùng
create table if not exists m3_tissue.cabinets (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,           -- TC-01
  name                text not null,
  room                text,
  last_maintained_at  date,
  last_filter_check_at date,                          -- kiểm tra màng lọc HEPA
  status              text default 'Đang dùng',       -- Đang dùng | Bảo trì | Ngừng dùng
  note                text,
  created_at          timestamptz default now()
);

-- M3.1.4 Phòng nuôi & ngưỡng điều kiện
create table if not exists m3_tissue.growth_rooms (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                 -- PN-01
  name          text not null,
  device_code   text,                                 -- mã thiết bị đo (hạng mục I.1.4)
  temp_min      double precision default 23,
  temp_max      double precision default 27,
  humidity_min  double precision default 50,
  humidity_max  double precision default 75,
  light_min     double precision default 2000,        -- lux
  light_max     double precision default 4000,
  photoperiod   text,                                 -- VD 16 sáng / 8 tối
  note          text,
  created_at    timestamptz default now()
);

create table if not exists m3_tissue.room_readings (
  id           bigserial primary key,
  room_id      uuid not null references m3_tissue.growth_rooms(id) on delete cascade,
  at           timestamptz not null default now(),
  temperature  double precision,
  humidity     double precision,
  light        double precision,
  source       text default 'Nhập tay',               -- Thiết bị | Nhập tay
  device_code  text,
  created_at   timestamptz default now()
);
create index if not exists idx_room_readings_room_at on m3_tissue.room_readings(room_id, at desc);

-- M3.1.3 Mẻ cấy: mẻ cha (cấy chuyển), lô môi trường, tủ cấy, phòng nuôi, số mẫu đầu vào / sống
alter table m3_tissue.culture_batches add column if not exists parent_batch_id uuid references m3_tissue.culture_batches(id) on delete set null;
alter table m3_tissue.culture_batches add column if not exists media_batch_id  uuid references m3_tissue.media_batches(id) on delete set null;
alter table m3_tissue.culture_batches add column if not exists cabinet_id      uuid references m3_tissue.cabinets(id) on delete set null;
alter table m3_tissue.culture_batches add column if not exists room_id         uuid references m3_tissue.growth_rooms(id) on delete set null;
alter table m3_tissue.culture_batches add column if not exists explants        integer default 0; -- số mẫu / chồi đưa vào cấy
alter table m3_tissue.culture_batches add column if not exists survived        integer default 0; -- số mẫu / chồi sống cuối giai đoạn
create index if not exists idx_culture_batches_parent on m3_tissue.culture_batches(parent_batch_id);
create index if not exists idx_culture_batches_cabinet on m3_tissue.culture_batches(cabinet_id);
create index if not exists idx_culture_batches_media_batch on m3_tissue.culture_batches(media_batch_id);
