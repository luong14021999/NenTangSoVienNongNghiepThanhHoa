-- 0006: Hệ thống quản lý theo ISO/IEC 17025:2017 (điều 7.10, 8.3, 8.7, 8.8, 8.9)

-- §8.3 Kiểm soát tài liệu hệ thống quản lý (nội bộ + bên ngoài)
create table if not exists public.qms_documents (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  title         text not null,
  doc_type      text default 'Quy trình', -- Sổ tay chất lượng | Quy trình | Hướng dẫn / SOP | Biểu mẫu | Tài liệu bên ngoài
  version       text,
  issued_at     date,
  approved_by   text,
  owner         text,
  review_due    date,
  status        text default 'Hiệu lực', -- Hiệu lực | Dự thảo | Hết hiệu lực
  distribution  text,
  note          text,
  created_at    timestamptz default now()
);

-- §7.10 Công việc không phù hợp + §8.7 Hành động khắc phục (CAPA)
create table if not exists public.nonconformities (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,
  detected_at        date,
  source             text,  -- Công việc thử nghiệm | Khiếu nại khách hàng | Đánh giá nội bộ | ...
  ref_code           text,  -- mã cuộc đánh giá / khiếu nại / mẫu liên quan
  clause             text,  -- điều khoản ISO/IEC 17025 liên quan
  description        text,
  severity           text default 'Nhẹ', -- Nhẹ | Nặng
  impact             text,  -- §7.10.1 c: đánh giá mức ảnh hưởng, thu hồi kết quả, thông báo KH
  immediate_action   text,  -- khắc phục tức thời
  root_cause         text,  -- §8.7.1 b
  corrective_action  text,  -- §8.7.1 c
  owner              text,
  due_at             date,
  status             text default 'Mở', -- Mở | Đang xử lý | Chờ đánh giá hiệu lực | Đã đóng
  effectiveness      text,  -- §8.7.1 d: đánh giá hiệu lực
  closed_at          date,
  created_at         timestamptz default now()
);
create index if not exists idx_nonconformities_status on public.nonconformities(status);
create index if not exists idx_nonconformities_ref on public.nonconformities(ref_code);

-- §8.8 Đánh giá nội bộ
create table if not exists public.internal_audits (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  planned_at        date,
  conducted_at      date,
  scope             text,  -- phạm vi / điều khoản đánh giá
  criteria          text,  -- chuẩn mực đánh giá
  auditors          text,  -- chuyên gia đánh giá (độc lập với khu vực được đánh giá)
  auditees          text,
  status            text default 'Kế hoạch', -- Kế hoạch | Đang thực hiện | Hoàn thành
  findings_summary  text,
  reported_to       text,  -- §8.8.2 d: báo cáo kết quả cho lãnh đạo liên quan
  created_at        timestamptz default now()
);

-- §8.9 Xem xét của lãnh đạo
create table if not exists public.management_reviews (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  meeting_at    date,
  period        text,  -- kỳ xem xét
  chair         text,
  participants  text,
  inputs_note   text,  -- ghi chú bổ sung cho các đầu vào §8.9.2
  outputs       text,  -- §8.9.3 quyết định & hành động
  actions       text,  -- phân công, thời hạn
  status        text default 'Kế hoạch', -- Kế hoạch | Đã họp | Đã hoàn tất hành động
  created_at    timestamptz default now()
);
