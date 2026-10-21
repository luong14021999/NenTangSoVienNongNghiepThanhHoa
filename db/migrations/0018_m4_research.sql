-- 0018: M4 đợt 3 – quản trị nhiệm vụ KH&CN (M4.4): nhiệm vụ & vòng đời, tiến độ, kinh phí, thành viên,
-- lý lịch khoa học, danh mục đề tài trên địa bàn tỉnh (chống trùng lặp), thí nghiệm đồng ruộng, liên kết mẫu M2.
-- Quy ước: docs/database-conventions.md.

-- Lý lịch khoa học / nhân lực nghiên cứu
create table if not exists m4.researchers (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,                -- NCV-001
  full_name     text not null,
  staff_code    text,                                -- mã nhân sự M2 (public.staff.code) nếu có
  birth_year    integer,
  gender        text,                                -- Nam | Nữ
  degree        text,                                -- Tiến sĩ | Thạc sĩ | Kỹ sư / Cử nhân | Cao đẳng | Khác
  academic_title text,                               -- Giáo sư | Phó giáo sư | (trống)
  specialty     text,                                -- chuyên ngành
  unit          text,                                -- phòng / bộ môn
  email         text,
  phone         text,
  orcid         text,
  publications  text,                                -- công trình tiêu biểu
  awards        text,
  status        text default 'Đang công tác',        -- Đang công tác | Cộng tác | Nghỉ hưu / chuyển công tác
  note          text,
  created_at    timestamptz default now()
);

-- Nhiệm vụ KH&CN (đề tài, dự án) – vòng đời nội bộ
create table if not exists m4.research_tasks (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,           -- NV-2026-001
  title              text not null,
  kind               text default 'Đề tài',          -- Đề tài | Dự án | Dự án SXTN | Nhiệm vụ thường xuyên | Hợp tác quốc tế
  level              text default 'Cấp cơ sở',       -- Cấp quốc gia | Cấp bộ | Cấp tỉnh | Cấp cơ sở | Hợp tác
  field              text,                           -- lĩnh vực
  leader_id          uuid references m4.researchers(id) on delete set null,
  host_unit          text,                           -- đơn vị chủ trì
  objectives         text,
  keywords           text,                           -- từ khóa, cách nhau dấu phẩy (dùng chống trùng lặp)
  start_at           date,
  end_at             date,
  budget_state       double precision default 0,     -- kinh phí ngân sách nhà nước (VND)
  budget_other       double precision default 0,     -- nguồn khác (VND)
  status             text default 'Đề xuất',         -- Đề xuất | Đang xét duyệt | Được phê duyệt | Đang thực hiện | Chờ nghiệm thu | Đã nghiệm thu | Không phê duyệt | Dừng
  approval_no        text,                           -- số quyết định phê duyệt
  approved_at        date,
  acceptance_result  text,                           -- Xuất sắc | Khá | Đạt | Không đạt
  accepted_at        date,
  outputs            text,                           -- sản phẩm: quy trình, giống, bài báo, sáng chế…
  national_ref       text,                           -- mã tiếp nhận khi gửi CSDL quốc gia
  note               text,
  created_at         timestamptz default now()
);
create index if not exists idx_research_tasks_status on m4.research_tasks(status);

-- Thành viên thực hiện
create table if not exists m4.task_members (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid not null references m4.research_tasks(id) on delete cascade,
  researcher_id   uuid not null references m4.researchers(id) on delete cascade,
  role            text default 'Thành viên',         -- Chủ nhiệm | Thư ký | Thành viên chính | Thành viên | Kỹ thuật viên
  workload_months double precision default 0,        -- số tháng quy đổi
  note            text,
  created_at      timestamptz default now(),
  unique (task_id, researcher_id)
);

-- Mốc tiến độ / sản phẩm trung gian
create table if not exists m4.task_milestones (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references m4.research_tasks(id) on delete cascade,
  title        text not null,
  deliverable  text,
  due_at       date,
  done_at      date,
  note         text,
  created_at   timestamptz default now()
);
create index if not exists idx_task_milestones_task_id on m4.task_milestones(task_id, due_at);

-- Giải ngân kinh phí
create table if not exists m4.task_expenses (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references m4.research_tasks(id) on delete cascade,
  spent_at     date,
  category     text default 'Vật tư – hóa chất',     -- Nhân công | Vật tư – hóa chất | Thiết bị | Thuê khoán | Hội thảo | Công tác phí | Quản lý | Khác
  amount       double precision default 0,
  source       text default 'Ngân sách nhà nước',    -- Ngân sách nhà nước | Nguồn khác
  document_no  text,                                  -- số chứng từ
  note         text,
  created_at   timestamptz default now()
);
create index if not exists idx_task_expenses_task_id on m4.task_expenses(task_id);

-- Mẫu phân tích M2 phục vụ nhiệm vụ (khai thác dữ liệu phòng thử nghiệm)
create table if not exists m4.task_samples (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references m4.research_tasks(id) on delete cascade,
  sample_code  text not null,                         -- public.samples.code
  purpose      text,
  created_at   timestamptz default now(),
  unique (task_id, sample_code)
);

-- Danh mục đề tài, dự án trên địa bàn tỉnh (do Sở KH&CN / các đơn vị) – tra cứu chống trùng lặp
create table if not exists m4.provincial_projects (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  title        text not null,
  host_org     text,
  leader       text,
  level        text,
  field        text,
  start_year   integer,
  end_year     integer,
  keywords     text,
  source       text default 'Nhập tay',               -- Sở KH&CN | CSDL quốc gia | Nhập tay
  status       text,                                  -- Đang thực hiện | Đã nghiệm thu | …
  note         text,
  created_at   timestamptz default now()
);

-- Thí nghiệm, khảo nghiệm đồng ruộng
create table if not exists m4.field_trials (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,               -- TN-2026-001
  task_id         uuid references m4.research_tasks(id) on delete set null,
  title           text not null,
  crop            text,                               -- cây trồng / vật nuôi
  design          text default 'Khối ngẫu nhiên đầy đủ (RCBD)', -- RCBD | Hoàn toàn ngẫu nhiên (CRD) | Ô lớn – ô nhỏ (Split-plot) | Ô vuông Latin | Khác
  treatments      integer default 0,                  -- số công thức
  replications    integer default 0,                  -- số lần nhắc lại
  plot_area_m2    double precision default 0,         -- diện tích ô thí nghiệm
  location        text,
  latitude        double precision,
  longitude       double precision,
  season          text,
  start_at        date,
  end_at          date,
  lead            text,
  status          text default 'Đang bố trí',         -- Đang bố trí | Đang theo dõi | Đã thu hoạch | Đã xử lý số liệu | Hủy
  results         text,
  note            text,
  created_at      timestamptz default now()
);
create index if not exists idx_field_trials_task_id on m4.field_trials(task_id);
