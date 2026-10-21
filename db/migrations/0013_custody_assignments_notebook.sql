-- 0013: Chuỗi hành trình mẫu (M2.1, §7.4), phân công theo năng lực (M2.2, §6.2), sổ tay thí nghiệm điện tử (M2.2, §7.5)

-- Sự kiện hành trình mẫu ghi tay (tiếp nhận, phân tích, kết quả, phiếu được ghép tự động từ dữ liệu khác)
create table if not exists public.sample_events (
  id           uuid primary key default gen_random_uuid(),
  sample_code  text not null,
  at           timestamptz default now(),
  actor        text,
  event        text not null, -- Bàn giao | Chuyển phân tích | Bảo quản | Lưu mẫu | Trả mẫu | Hủy mẫu | Ghi nhận khác
  location     text,
  condition    text,  -- tình trạng / nhiệt độ bảo quản
  receiver     text,  -- người nhận khi bàn giao
  note         text
);
create index if not exists idx_sample_events_sample on public.sample_events(sample_code, at);

-- Phân công chỉ tiêu × mẫu cho KTV có ủy quyền
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  sample_code  text not null,
  test_label   text not null,
  assignee     text not null,
  assigned_by  text,
  assigned_at  timestamptz default now(),
  due_at       date,
  status       text default 'Đã giao', -- Đã giao | Đang làm | Hoàn thành | Hủy
  note         text
);
create index if not exists idx_assignments_sample on public.assignments(sample_code);

-- Sổ tay thí nghiệm điện tử: chỉ ghi thêm; sửa = mục đính chính tham chiếu mục gốc
create table if not exists public.notebook_entries (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,  -- NK-YYYY-NNNNN
  at            timestamptz default now(),
  author        text not null,
  sample_code   text,
  test_label    text,
  title         text not null,
  content       text not null,
  equipment     text,
  conditions    text,   -- điều kiện môi trường / thí nghiệm
  corrects_code text,   -- mục bị đính chính (nếu có)
  content_hash  text not null
);
create index if not exists idx_notebook_sample on public.notebook_entries(sample_code);
