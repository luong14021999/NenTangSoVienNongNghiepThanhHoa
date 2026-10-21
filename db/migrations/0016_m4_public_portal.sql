-- 0016: M4 đợt 1 – cổng tiếp nhận dịch vụ trực tuyến (M4.1), tra cứu công khai (M4.3),
-- giới hạn tần suất cho cổng (M4.7). Quy ước: docs/database-conventions.md.

-- Yêu cầu dịch vụ (trực tuyến qua cổng, hoặc cán bộ nhập khi khách đến trực tiếp / gọi điện)
create table if not exists m4.service_requests (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,               -- YC-2026-7K3QPM (ngẫu nhiên, khó đoán – dùng để tra cứu)
  kind            text not null,                      -- Phân tích – thử nghiệm | Nuôi cấy mô – cây giống | Giống cây trồng, vật nuôi, thủy sản | Tư vấn – chuyển giao | Khác
  target_unit     text not null,                      -- M2 – Phòng Phân tích và Thí nghiệm | M3.1 – Nuôi cấy mô | M3.2 – Giống | Bộ phận tư vấn
  channel         text default 'Trực tuyến',          -- Trực tuyến | Trực tiếp | Điện thoại | Email
  org_name        text,                               -- tổ chức / hộ gia đình
  contact_name    text not null,
  phone           text not null,
  email           text,
  address         text,
  description     text not null,                      -- nội dung yêu cầu
  sample_count    integer default 0,
  status          text default 'Mới tiếp nhận',       -- Mới tiếp nhận | Đang xử lý | Đã báo giá | Đang thực hiện | Hoàn thành | Từ chối
  handler         text,                               -- cán bộ xử lý
  public_note     text,                               -- phản hồi hiển thị cho khách khi tra cứu
  customer_id     uuid references public.customers(id) on delete set null,
  quotation_id    uuid references m4.quotations(id) on delete set null,
  ip_hash         text,                               -- sha256(salt + IP) – không lưu IP gốc
  note            text,                               -- ghi chú nội bộ (không công bố)
  created_at      timestamptz default now()
);
create index if not exists idx_service_requests_status on m4.service_requests(status, created_at desc);

-- Bảng giá dịch vụ; published = hiện trên cổng công khai
create table if not exists m4.price_items (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                  -- DV-DAT-01
  name         text not null,
  category     text,                                  -- Phân tích đất | Phân tích nước | Phân tích phân bón | Phân tích rau, quả | Cây giống nuôi cấy mô | Giống | Tư vấn – chuyển giao | Khác
  unit         text default 'mẫu',
  price        double precision default 0,            -- VND, đã gồm thuế
  turnaround   text,                                  -- thời gian trả kết quả, VD: 7 ngày làm việc
  method       text,                                  -- phương pháp / tiêu chuẩn
  vilas        boolean default false,                 -- thuộc phạm vi công nhận VILAS 1501
  published    boolean default false,
  note         text,
  created_at   timestamptz default now()
);

-- Nội dung công bố trên cổng: biểu mẫu, hồ sơ năng lực, thông báo
create table if not exists m4.public_resources (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,                  -- BM-01
  kind         text default 'Biểu mẫu',               -- Biểu mẫu | Năng lực | Thông báo
  title        text not null,
  url          text,                                  -- đường dẫn tải về (https://…)
  description  text,
  published    boolean default false,
  sort_order   integer default 0,
  note         text,
  created_at   timestamptz default now()
);

-- Lượt truy cập API công khai để giới hạn tần suất (M4.7); dọn bản ghi > 2 ngày khi ghi
create table if not exists m4.public_hits (
  id        bigserial primary key,
  action    text not null,                            -- request | status
  ip_hash   text not null,
  at        timestamptz default now()
);
create index if not exists idx_public_hits_action_ip on m4.public_hits(action, ip_hash, at desc);
