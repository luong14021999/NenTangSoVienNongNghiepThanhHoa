-- Bổ sung 2 field cho environment_readings theo form AEMD-BM-10.02
-- - monitoring_device: thiết bị dùng để kiểm soát (VD: "Nhiệt kế Hanna HI-91410")
-- - note: ghi chú riêng cho từng lần đo

alter table public.environment_readings
  add column if not exists monitoring_device text,
  add column if not exists note text;
