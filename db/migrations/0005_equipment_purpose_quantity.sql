-- 0005: Thiết bị – thêm "Dùng cho phép thử" và "Số lượng" (danh mục VILAS 1501)
alter table public.equipment
  add column if not exists purpose  text,
  add column if not exists quantity text;
