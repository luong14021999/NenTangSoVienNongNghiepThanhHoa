-- 0023: M3.2 đợt D – đối soát trình tự BLAST+ (M3.2.4), chỉ thị phân tử (M3.2.5), cơ sở sản xuất & phân bố giống (M3.2.7),
-- dịch vụ kỹ thuật, kết nối cung – cầu, thông tin thị trường (M3.2.8). Quy ước: docs/database-conventions.md.

-- ── M3.2.4 BLAST+: chỉ lưu thông tin mô tả & kết quả – trình tự nằm trên máy chủ BLAST nội bộ ──
create table if not exists m3_breed.sequence_refs (
  id            uuid primary key default gen_random_uuid(),
  accession     text unique not null,                -- mã trình tự trong CSDL BLAST nội bộ
  molecule      text default 'ADN',                  -- ADN | ARN | Protein
  gene          text,                                -- gen / vùng (ITS, matK, rbcL, COI…)
  variety_id    uuid references m3_breed.varieties(id) on delete set null,
  germplasm_id  uuid references m3_breed.germplasm(id) on delete set null,
  length        integer,
  checksum      text,                                -- sha256 trình tự (đối chiếu toàn vẹn, không lộ trình tự)
  note          text,
  created_at    timestamptz default now()
);

create table if not exists m3_breed.blast_searches (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                 -- BL-2026-XXXX
  program      text default 'blastn',                -- blastn | blastp
  query_label  text,                                 -- nhãn mẫu truy vấn (không lưu trình tự)
  query_length integer,
  query_sha256 text,
  evalue       double precision default 1e-5,
  hits         jsonb default '[]'::jsonb,            -- [{accession, identity, length, evalue, bitscore, …}]
  status       text default 'Hoàn thành',            -- Hoàn thành | Lỗi
  error        text,
  actor        text,
  created_at   timestamptz default now()
);

-- ── M3.2.5 Chỉ thị phân tử ─────────────────────────────────────────
create table if not exists m3_breed.markers (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                  -- RM1, SNP_01, ITS2
  kind        text default 'SSR',                    -- SSR | SNP | Mã vạch ADN
  name        text,
  locus       text,                                  -- nhiễm sắc thể / vị trí
  primers     text,                                  -- mồi xuôi / ngược hoặc vị trí SNP
  alleles     text,                                  -- alen đã biết
  note        text,
  created_at  timestamptz default now()
);

create table if not exists m3_breed.genotype_samples (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,             -- mã mẫu phân tích ADN
  purpose          text default 'Giống tham chiếu',  -- Giống tham chiếu | Mẫu cần nhận dạng | Cây kiểm tra độ thuần
  variety_id       uuid references m3_breed.varieties(id) on delete set null,
  seed_lot_id      uuid references m3_breed.seed_lots(id) on delete set null,
  individual_id    uuid references m3_breed.individuals(id) on delete set null,
  germplasm_id     uuid references m3_breed.germplasm(id) on delete set null,
  lab_sample_code  text,                             -- mã mẫu M2 (nếu phân tích tại phòng thí nghiệm)
  collected_at     date,
  note             text,
  created_at       timestamptz default now()
);

create table if not exists m3_breed.genotype_calls (
  id         uuid primary key default gen_random_uuid(),
  sample_id  uuid not null references m3_breed.genotype_samples(id) on delete cascade,
  marker_id  uuid not null references m3_breed.markers(id) on delete cascade,
  allele1    text not null,                          -- kích thước băng (bp) hoặc nucleotide
  allele2    text,                                   -- trống = đồng hợp
  created_at timestamptz default now(),
  unique (sample_id, marker_id)
);
create index if not exists idx_genotype_calls_marker on m3_breed.genotype_calls(marker_id);

-- ── M3.2.7 Cơ sở sản xuất giống & phân bố giống ────────────────────
create table if not exists m3_breed.facilities (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,           -- CS-001
  name               text not null,
  kind               text default 'Của Viện',        -- Của Viện | Liên kết
  owner              text,
  address            text,
  district           text,                           -- huyện / thị xã / thành phố
  latitude           double precision,
  longitude          double precision,
  scale              text,                           -- quy mô (ha, số con bố mẹ, số lồng…)
  capacity           text,                           -- năng lực sản xuất / năm
  species            text,                           -- loài / giống sản xuất
  conditions         text,                           -- điều kiện sản xuất
  inspected_at       date,
  inspection_result  text default 'Chưa kiểm tra',   -- Đạt | Không đạt | Chưa kiểm tra
  certificate        text,                           -- giấy chứng nhận đủ điều kiện (nếu có)
  status             text default 'Đang hoạt động',  -- Đang hoạt động | Tạm dừng | Ngừng liên kết
  note               text,
  created_at         timestamptz default now()
);

create table if not exists m3_breed.distributions (
  id          uuid primary key default gen_random_uuid(),
  variety_id  uuid references m3_breed.varieties(id) on delete cascade,
  district    text not null,
  year        integer not null,
  area_ha     double precision default 0,            -- diện tích / quy mô (ha hoặc nghìn con – ghi ở đơn vị)
  unit        text default 'ha',
  source      text,
  created_at  timestamptz default now(),
  unique (variety_id, district, year, unit)
);

alter table m3_breed.production_lots add column if not exists facility_id uuid references m3_breed.facilities(id) on delete set null;

-- ── M3.2.8 Dịch vụ kỹ thuật, cung – cầu, thông tin thị trường ──────
alter table m3_breed.varieties add column if not exists is_public         boolean default false; -- giới thiệu trên cổng công khai
alter table m3_breed.varieties add column if not exists public_summary    text;                  -- mô tả ngắn cho người dùng
alter table m3_breed.varieties add column if not exists guide_knowledge_id uuid references m4.knowledge_items(id) on delete set null; -- quy trình kỹ thuật kèm giống (M4.5)

create table if not exists m3_breed.market_posts (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                -- TT-GIONG-001
  kind          text default 'Thông tin thị trường', -- Thông tin thị trường | Mô hình hiệu quả | Tiến bộ kỹ thuật | Nguồn giống | Hỗ trợ sau cung ứng
  title         text not null,
  summary       text,
  content       text,
  variety_id    uuid references m3_breed.varieties(id) on delete set null,
  area          text,                                -- địa phương liên quan
  price_note    text,                                -- thông tin giá (nếu có)
  published_at  date default current_date,
  is_public     boolean default false,
  note          text,
  created_at    timestamptz default now()
);
