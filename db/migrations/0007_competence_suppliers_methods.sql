-- 0007: ISO/IEC 17025:2017 – Đợt 2 (điều 4.1, 4.2, 6.2, 6.6, 7.2)

-- §4.1 + §4.2 Cam kết khách quan và bảo mật của nhân viên
create table if not exists public.staff_commitments (
  id                 uuid primary key default gen_random_uuid(),
  staff_name         text not null,
  kind               text default 'Khách quan & bảo mật', -- Khách quan & bảo mật | Khách quan | Bảo mật
  signed_at          date,
  valid_until        date,
  conflict_declared  text,  -- khai báo xung đột lợi ích (nếu có)
  doc_ref            text,  -- số / mã bản cam kết lưu hồ sơ
  note               text,
  created_at         timestamptz default now()
);

-- §6.2 Ủy quyền nhân viên theo từng phép thử + theo dõi năng lực
create table if not exists public.test_authorizations (
  id               uuid primary key default gen_random_uuid(),
  staff_name       text not null,
  test_label       text not null, -- "#<TT> · <đối tượng> · <phép thử>" theo danh mục VILAS 1501
  role             text default 'Thực hiện phép thử', -- Thực hiện phép thử | Xem xét kết quả | Phê duyệt & ký phiếu kết quả
  authorized_at    date,
  authorized_by    text,
  valid_until      date,
  evidence         text,  -- căn cứ năng lực: đào tạo, mẫu kiểm tra, PT…
  next_monitor_at  date,  -- lần theo dõi năng lực kế tiếp
  status           text default 'Hiệu lực', -- Hiệu lực | Tạm dừng | Hết hiệu lực
  note             text,
  created_at       timestamptz default now()
);
create index if not exists idx_test_authorizations_test on public.test_authorizations(test_label);

-- §6.6 Sản phẩm và dịch vụ do bên ngoài cung cấp
create table if not exists public.suppliers (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  name                text not null,
  category            text, -- Hóa chất & chất chuẩn | Dụng cụ – vật tư | Thiết bị | Dịch vụ hiệu chuẩn | Thử nghiệm thành thạo (PT) | Bảo trì – sửa chữa | Khác
  provides            text, -- sản phẩm / dịch vụ cung cấp
  contact             text,
  phone               text,
  accreditation       text, -- năng lực / công nhận (VD: VILAS, VLAT, ISO 17034…)
  status              text default 'Đang đánh giá', -- Được phê duyệt | Đang đánh giá | Ngừng sử dụng
  evaluated_at        date,
  result              text, -- Đạt | Đạt có điều kiện | Không đạt
  next_evaluation_at  date,
  criteria            text, -- tiêu chí / nhận xét đánh giá
  note                text,
  created_at          timestamptz default now()
);

-- §7.2 Kiểm tra xác nhận / xác nhận giá trị sử dụng phương pháp
create table if not exists public.method_validations (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null, -- mã báo cáo
  test_label      text not null,
  kind            text, -- Kiểm tra xác nhận phương pháp tiêu chuẩn | Xác nhận giá trị sử dụng phương pháp nội bộ | Xác nhận lại khi có thay đổi
  performed_at    date,
  performed_by    text,
  lod             text,
  loq             text,
  linearity       text, -- khoảng tuyến tính / R²
  repeatability   text, -- RSD lặp lại
  reproducibility text, -- RSD tái lập nội bộ
  recovery        text, -- độ thu hồi / độ đúng
  uncertainty     text, -- độ không đảm bảo đo mở rộng
  conclusion      text default 'Đang thực hiện', -- Đạt | Không đạt | Đang thực hiện
  approved_by     text,
  next_review_at  date,
  note            text,
  created_at      timestamptz default now()
);
create index if not exists idx_method_validations_test on public.method_validations(test_label);
