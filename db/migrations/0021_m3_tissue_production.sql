-- 0021: M3.1 đợt B – kế hoạch & điều độ theo đơn hàng, vườn ươm (M3.1.5); kho vật tư, giá thành,
-- xuất bán, phản hồi khách hàng (M3.1.6). Quy ước: docs/database-conventions.md.

-- Thông số kỹ thuật sản xuất theo loài / giống (dùng để lập kế hoạch tính ngược)
create table if not exists m3_tissue.production_profiles (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,          -- TS-CHUOI-01
  species               text not null,
  variety               text,
  multiplication_rate   double precision default 3,    -- hệ số nhân mỗi lần cấy chuyển
  cycle_days            integer default 30,            -- chu kỳ 1 lần cấy chuyển
  rooting_days          integer default 30,            -- giai đoạn ra rễ
  nursery_days          integer default 45,            -- ra ngôi → đủ tiêu chuẩn xuất
  invitro_survival      double precision default 90,   -- % sống (nhân + ra rễ, sau trừ nhiễm)
  nursery_survival      double precision default 85,   -- % sống ở vườn ươm
  grade1_share          double precision default 80,   -- % cây đạt Loại 1 trong số sống
  note                  text,
  created_at            timestamptz default now()
);

-- Đơn hàng cây giống
create table if not exists m3_tissue.orders (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,               -- DH-2026-001
  customer_id     uuid references public.customers(id) on delete set null,
  contract_id     uuid references m4.contracts(id) on delete set null, -- hợp đồng M4 (nếu có)
  profile_id      uuid references m3_tissue.production_profiles(id) on delete set null,
  species         text not null,
  variety         text,
  quantity        integer not null default 0,         -- số cây cần giao
  grade_required  text default 'Loại 1',              -- Loại 1 | Loại 2 | Không yêu cầu
  due_at          date,                               -- ngày cần giao
  season          text,                               -- vụ trồng của khách
  unit_price      double precision default 0,         -- VND / cây
  status          text default 'Mới',                 -- Mới | Đã xác nhận | Đang sản xuất | Giao một phần | Hoàn thành | Hủy
  note            text,
  created_at      timestamptz default now()
);
create index if not exists idx_orders_due on m3_tissue.orders(status, due_at);

alter table m3_tissue.culture_batches add column if not exists order_id uuid references m3_tissue.orders(id) on delete set null;
alter table m3_tissue.seedling_lots   add column if not exists order_id uuid references m3_tissue.orders(id) on delete set null;
-- Vườn ươm: vị trí, ngày đủ tiêu chuẩn, phân loại chất lượng theo số cây
alter table m3_tissue.seedling_lots add column if not exists nursery_bed text;
alter table m3_tissue.seedling_lots add column if not exists ready_at    date;
alter table m3_tissue.seedling_lots add column if not exists grade1_qty  integer default 0;
alter table m3_tissue.seedling_lots add column if not exists grade2_qty  integer default 0;
alter table m3_tissue.seedling_lots add column if not exists reject_qty  integer default 0;

-- Kho vật tư (hóa chất, bình, nhãn, giá thể…)
create table if not exists m3_tissue.supplies (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                   -- VT-001
  name        text not null,
  category    text default 'Hóa chất',                -- Hóa chất | Bình – dụng cụ | Giá thể – bầu | Khác
  unit        text default 'g',                       -- đơn vị tồn kho = đơn vị định giá
  unit_price  double precision default 0,             -- VND / đơn vị
  min_stock   double precision default 0,
  note        text,
  created_at  timestamptz default now()
);

create table if not exists m3_tissue.supply_moves (
  id          uuid primary key default gen_random_uuid(),
  supply_id   uuid not null references m3_tissue.supplies(id) on delete cascade,
  moved_at    date default current_date,
  kind        text default 'Nhập',                    -- Nhập | Xuất | Kiểm kê điều chỉnh
  quantity    double precision not null,              -- luôn dương; Xuất trừ tồn; điều chỉnh có thể âm
  unit_price  double precision,                       -- giá nhập (cập nhật đơn giá vật tư)
  ref         text,                                   -- số phiếu / mã lô môi trường
  actor       text,
  note        text,
  created_at  timestamptz default now()
);
create index if not exists idx_supply_moves_supply on m3_tissue.supply_moves(supply_id, moved_at desc);

-- Định mức hóa chất gắn vật tư để tính giá
alter table m3_tissue.recipe_chemicals add column if not exists supply_id uuid references m3_tissue.supplies(id) on delete set null;

-- Xuất bán (một lô có thể xuất nhiều lần)
create table if not exists m3_tissue.lot_sales (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                  -- PX-2026-001 (số phiếu xuất)
  lot_id       uuid not null references m3_tissue.seedling_lots(id) on delete cascade,
  order_id     uuid references m3_tissue.orders(id) on delete set null,
  customer_id  uuid references public.customers(id) on delete set null,
  sold_at      date default current_date,
  quantity     integer not null default 0,
  grade        text default 'Loại 1',
  unit_price   double precision default 0,            -- VND / cây
  note         text,
  created_at   timestamptz default now()
);
create index if not exists idx_lot_sales_lot on m3_tissue.lot_sales(lot_id);

-- Chuyển dữ liệu xuất bán cũ (1 lần xuất ghi trên lô) sang phiếu xuất
insert into m3_tissue.lot_sales (code, lot_id, customer_id, sold_at, quantity, note)
select 'PX-CU-' || l.code, l.id, l.customer_id, coalesce(l.released_at, current_date), l.released_qty, 'Chuyển từ dữ liệu xuất cũ của lô'
from m3_tissue.seedling_lots l
where coalesce(l.released_qty, 0) > 0
on conflict (code) do nothing;

-- Phản hồi khách hàng (cán bộ nhập hoặc khách gửi qua trang QR công khai)
create table if not exists m3_tissue.lot_feedback (
  id              uuid primary key default gen_random_uuid(),
  lot_id          uuid references m3_tissue.seedling_lots(id) on delete set null,
  customer_id     uuid references public.customers(id) on delete set null,
  received_at     timestamptz default now(),
  channel         text default 'Cán bộ ghi nhận',     -- Trang QR | Cán bộ ghi nhận | Điện thoại
  contact_name    text,
  phone           text,
  survival_pct    double precision,                   -- tỷ lệ sống khách báo (%)
  rating          integer,                            -- 1–5
  content         text not null,
  response        text,
  status          text default 'Mới',                 -- Mới | Đang xử lý | Đã phản hồi
  ip_hash         text,
  note            text,
  created_at      timestamptz default now()
);
create index if not exists idx_lot_feedback_lot on m3_tissue.lot_feedback(lot_id);
