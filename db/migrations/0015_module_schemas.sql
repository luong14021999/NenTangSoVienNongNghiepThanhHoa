-- 0015: Schema riêng cho từng phân hệ + bảng nền đầu tiên của M4, M3.1, M3.2.
--
-- QUY ƯỚC (chi tiết: docs/database-conventions.md)
--   Schema      public     – M1 nền tảng dùng chung (người dùng, phân quyền, danh mục, nhật ký, khách hàng)
--                            + các bảng M2 (LIMS) đã có từ trước – giữ nguyên, không di chuyển.
--               analytics  – kho dữ liệu (bảng fact/dim, chỉ đọc cho báo cáo).
--               m4         – Dịch vụ KH&CN: bảng giá, báo giá, hợp đồng, thanh toán, công nợ.
--               m3_tissue  – M3.1 Nuôi cấy mô & truy xuất nguồn gốc.
--               m3_breed   – M3.2 Giống cây trồng, vật nuôi, thủy sản.
--   Bảng        snake_case, danh từ số nhiều tiếng Anh (quotations, culture_batches).
--   Cột         snake_case; khóa chính id uuid; mã nghiệp vụ code text unique not null;
--               khóa ngoại <bảng số ít>_id (customer_id, batch_id); ngày *_at kiểu date/timestamptz;
--               tiền VND double precision (số nguyên đồng); trạng thái status text kèm comment các giá trị;
--               luôn có note text và created_at timestamptz default now().
--   Liên kết    bảng phân hệ được tham chiếu bảng dùng chung ở public (VD public.customers);
--               public KHÔNG tham chiếu ngược vào schema phân hệ; giữa hai phân hệ chỉ tham chiếu khi
--               thật cần và luôn on delete set null.
--   Chỉ mục     idx_<bảng>_<cột>.

create schema if not exists m4;
create schema if not exists m3_tissue;
create schema if not exists m3_breed;
comment on schema m4 is 'M4 – Dịch vụ KH&CN & khách hàng: báo giá, hợp đồng, thanh toán, công nợ';
comment on schema m3_tissue is 'M3.1 – Nuôi cấy mô & truy xuất nguồn gốc cây giống';
comment on schema m3_breed is 'M3.2 – Giống cây trồng, vật nuôi, thủy sản';

-- ─────────────────────────── M4 ───────────────────────────

-- Báo giá gửi khách hàng
create table if not exists m4.quotations (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                -- BG-2026-001
  customer_id   uuid references public.customers(id) on delete set null,
  title         text not null,                       -- nội dung dịch vụ
  issued_at     date,
  valid_until   date,
  amount        double precision default 0,          -- giá trước thuế (VND)
  vat_rate      double precision default 0,          -- % thuế GTGT
  status        text default 'Nháp',                 -- Nháp | Đã gửi | Được chấp nhận | Từ chối | Hết hạn
  prepared_by   text,
  note          text,
  created_at    timestamptz default now()
);
create index if not exists idx_quotations_customer_id on m4.quotations(customer_id);

-- Hợp đồng dịch vụ
create table if not exists m4.contracts (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                -- HĐ-2026-001
  customer_id   uuid references public.customers(id) on delete set null,
  quotation_id  uuid references m4.quotations(id) on delete set null,
  title         text not null,
  signed_at     date,
  start_at      date,
  end_at        date,
  value         double precision default 0,          -- giá trị hợp đồng sau thuế (VND)
  status        text default 'Đang soạn',            -- Đang soạn | Đã ký | Đang thực hiện | Đã nghiệm thu | Đã thanh lý | Hủy
  owner         text,                                -- cán bộ phụ trách
  note          text,
  created_at    timestamptz default now()
);
create index if not exists idx_contracts_customer_id on m4.contracts(customer_id);

-- Phiếu thu / thanh toán theo hợp đồng
create table if not exists m4.payments (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                -- số chứng từ PT-2026-001
  contract_id   uuid references m4.contracts(id) on delete set null,
  paid_at       date,
  amount        double precision default 0,          -- VND
  method        text default 'Chuyển khoản',         -- Chuyển khoản | Tiền mặt
  invoice_no    text,                                -- số hóa đơn điện tử
  note          text,
  created_at    timestamptz default now()
);
create index if not exists idx_payments_contract_id on m4.payments(contract_id);

-- ─────────────────────── M3.1 Nuôi cấy mô ───────────────────────

-- Vật liệu khởi đầu (mẫu cấy ban đầu)
create table if not exists m3_tissue.materials (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,               -- VL-2026-001
  species        text not null,                      -- loài (Chuối, Lan, Mía…)
  variety        text,                               -- giống
  source         text,                               -- cây mẹ / nơi lấy
  collected_at   date,
  explant_type   text,                               -- Đỉnh sinh trưởng | Mắt ngủ | Lá | Hạt | Khác
  quantity       integer default 0,                  -- số mẫu đưa vào
  sterilization  text,                               -- quy trình khử trùng
  status         text default 'Đang khử trùng',      -- Đang khử trùng | Sạch – đưa vào nuôi cấy | Nhiễm – loại bỏ
  note           text,
  created_at     timestamptz default now()
);

-- Công thức môi trường nuôi cấy
create table if not exists m3_tissue.media_recipes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                -- MT-NN-01
  name          text not null,
  stage         text,                                -- Khởi đầu | Nhân nhanh | Ra rễ | Ra ngôi
  base_medium   text,                                -- MS | ½MS | WPM | B5 | Khác
  hormones      text,                                -- VD: BAP 2 mg/l + NAA 0,5 mg/l
  sugar_gl      double precision,                    -- đường (g/l)
  agar_gl       double precision,                    -- agar (g/l)
  ph            double precision,
  status        text default 'Đang dùng',            -- Đang dùng | Thử nghiệm | Ngừng dùng
  note          text,
  created_at    timestamptz default now()
);

-- Mẻ cấy (mỗi lần cấy / cấy chuyển)
create table if not exists m3_tissue.culture_batches (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,            -- ME-2026-001
  material_id       uuid references m3_tissue.materials(id) on delete set null,
  recipe_id         uuid references m3_tissue.media_recipes(id) on delete set null,
  stage             text,                            -- Khởi đầu | Nhân nhanh | Ra rễ
  subculture_no     integer default 0,               -- lần cấy chuyển thứ
  started_at        date,
  next_transfer_at  date,
  vessels           integer default 0,               -- số bình cấy
  contaminated      integer default 0,               -- số bình nhiễm
  plantlets         integer default 0,               -- số chồi / cây thu được
  room              text,                            -- phòng nuôi / giàn
  operator          text,
  status            text default 'Đang nuôi',        -- Đang nuôi | Đã cấy chuyển | Chuyển ra ngôi | Hủy
  note              text,
  created_at        timestamptz default now()
);
create index if not exists idx_culture_batches_material_id on m3_tissue.culture_batches(material_id);

-- Lô cây giống ra ngôi / xuất bán – đơn vị truy xuất nguồn gốc
create table if not exists m3_tissue.seedling_lots (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,             -- LO-2026-001 (in trên tem truy xuất)
  batch_id         uuid references m3_tissue.culture_batches(id) on delete set null,
  acclimatized_at  date,                             -- ngày ra ngôi
  quantity         integer default 0,                -- số cây ra ngôi
  survived         integer default 0,                -- số cây sống
  grade            text,                             -- Loại 1 | Loại 2 | Không đạt
  customer_id      uuid references public.customers(id) on delete set null,
  released_at      date,                             -- ngày xuất
  released_qty     integer default 0,
  status           text default 'Vườn ươm',          -- Vườn ươm | Đủ tiêu chuẩn xuất | Đã xuất | Hủy
  note             text,
  created_at       timestamptz default now()
);
create index if not exists idx_seedling_lots_batch_id on m3_tissue.seedling_lots(batch_id);

-- ─────────────────────── M3.2 Giống ───────────────────────

-- Lý lịch giống
create table if not exists m3_breed.varieties (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,             -- GI-001
  name             text not null,
  kind             text default 'Cây trồng',         -- Cây trồng | Vật nuôi | Thủy sản
  species          text,
  origin           text,                             -- nguồn gốc / tổ hợp lai
  owner            text,                             -- tác giả / chủ sở hữu
  recognition_no   text,                             -- số quyết định công nhận
  recognized_at    date,
  traits           text,                             -- đặc điểm chính
  status           text default 'Đang khảo nghiệm',  -- Đang khảo nghiệm | Được công nhận | Lưu hành | Ngừng sản xuất
  note             text,
  created_at       timestamptz default now()
);

-- Nguồn gen (tập đoàn lưu giữ)
create table if not exists m3_breed.germplasm (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,            -- NG-0001 (số đăng ký mẫu nguồn gen)
  kind              text default 'Cây trồng',        -- Cây trồng | Vật nuôi | Thủy sản
  species           text not null,
  local_name        text,
  collected_at      date,
  collection_site   text,
  conservation      text,                            -- Đồng ruộng | Kho lạnh | In vitro | Đông lạnh | Trang trại
  quantity          text,                            -- VD: 500 g hạt, 20 cây, 30 con
  evaluation        text,                            -- kết quả đánh giá đặc tính
  status            text default 'Đang lưu giữ',     -- Đang lưu giữ | Cần phục tráng | Đã mất
  note              text,
  created_at        timestamptz default now()
);

-- Khảo nghiệm / sản xuất thử
create table if not exists m3_breed.trials (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                 -- KN-2026-001
  variety_id   uuid references m3_breed.varieties(id) on delete set null,
  kind         text default 'Khảo nghiệm VCU',       -- Khảo nghiệm VCU | Khảo nghiệm DUS | Sản xuất thử | So sánh giống
  site         text,
  season       text,                                 -- Vụ Xuân 2026, Vụ Mùa 2026…
  start_at     date,
  end_at       date,
  yield        text,                                 -- năng suất / chỉ tiêu chính
  result       text default 'Đang theo dõi',         -- Đang theo dõi | Đạt | Không đạt
  leader       text,
  note         text,
  created_at   timestamptz default now()
);
create index if not exists idx_trials_variety_id on m3_breed.trials(variety_id);
