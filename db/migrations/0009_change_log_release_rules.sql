-- 0009: Kiểm soát dữ liệu (§7.11) + quy tắc kiểm soát trước phát hành có phiên bản (M2.5)

-- Nhật ký thay đổi chung: mọi thêm / sửa / xoá qua API đều ghi người, thời điểm, giá trị cũ → mới
create table if not exists public.change_log (
  id          uuid primary key default gen_random_uuid(),
  at          timestamptz default now(),
  actor       text,
  entity      text not null,   -- tên collection, VD "decision-rules"
  entity_id   text,
  action      text not null,   -- Thêm | Sửa | Xoá | Phê duyệt …
  label       text,            -- nhãn dễ đọc của bản ghi
  changes     jsonb default '[]'::jsonb  -- [{field, old, new}]
);
create index if not exists idx_change_log_entity on public.change_log(entity, entity_id);
create index if not exists idx_change_log_at on public.change_log(at desc);

-- Bộ quy tắc kiểm soát trước phát hành, mỗi lần sửa = 1 phiên bản; phiên bản chỉ có hiệu lực khi được phê duyệt
create table if not exists public.release_rule_sets (
  id           uuid primary key default gen_random_uuid(),
  version      integer unique not null,
  status       text default 'Dự thảo',  -- Dự thảo | Hiệu lực | Hết hiệu lực
  rules        jsonb not null,
  change_note  text,
  created_by   text,
  created_at   timestamptz default now(),
  approved_by  text,
  approved_at  timestamptz
);

-- Quy tắc quyết định: số phiên bản tăng mỗi lần sửa (lịch sử chi tiết ở change_log)
alter table public.decision_rules add column if not exists version integer default 1;
