-- 0008: Phiếu kết quả thử nghiệm (ISO/IEC 17025:2017 §7.8) – lưu bản chụp nội dung khi phát hành (§8.4)
create table if not exists public.test_reports (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,          -- PKQ-VNNTH-YYYY-NNNNN
  sample_code    text not null,
  revision       integer default 0,             -- §7.8.8 sửa đổi: 0 = bản gốc
  replaces_code  text,                          -- mã phiếu bị thay thế (nếu là bản sửa đổi)
  status         text default 'Đã phát hành',   -- Đã phát hành | Đã thay thế
  issued_at      timestamptz default now(),
  issued_by      text,
  note           text,                          -- sai lệch / bổ sung / loại trừ khỏi phương pháp, ghi chú tình trạng mẫu
  snapshot       jsonb not null,                -- nội dung phiếu tại thời điểm phát hành
  created_at     timestamptz default now()
);
create index if not exists idx_test_reports_sample on public.test_reports(sample_code);
