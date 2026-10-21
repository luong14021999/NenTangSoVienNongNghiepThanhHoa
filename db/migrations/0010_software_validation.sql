-- 0010: Hồ sơ xác nhận giá trị sử dụng phần mềm (ISO/IEC 17025:2017 §7.11.2)
-- Mỗi lần chạy bộ kiểm thử tự động trên 1 phiên bản mã nguồn = 1 bản ghi
create table if not exists public.software_validation_runs (
  id           uuid primary key default gen_random_uuid(),
  git_sha      text not null,        -- phiên bản mã nguồn được xác nhận
  git_dirty    boolean default false, -- có thay đổi chưa commit lúc chạy
  git_subject  text,
  app_version  text,
  run_at       timestamptz default now(),
  run_by       text,
  environment  text,
  total        integer,
  passed       integer,
  failed       integer,
  duration_ms  integer,
  cases        jsonb default '[]'::jsonb, -- [{id, suite, name, status, durationMs, error}]
  note         text
);
create index if not exists idx_software_validation_sha on public.software_validation_runs(git_sha);
