-- 0017: M4 đợt 2 – hoàn thiện quản lý dịch vụ (M4.2): định mức, báo giá theo dòng + phê duyệt,
-- thời hạn & trả kết quả, hóa đơn điện tử, nhật ký chăm sóc khách hàng. Quy ước: docs/database-conventions.md.

-- Đơn giá trong bảng giá: CHƯA gồm thuế GTGT (thuế tính trên báo giá). Định mức chi phí trên 1 đơn vị tính.
comment on column m4.price_items.price is 'Đơn giá VND, chưa gồm thuế GTGT';
alter table m4.price_items add column if not exists cost_materials    double precision default 0; -- vật tư, hóa chất
alter table m4.price_items add column if not exists cost_labor        double precision default 0; -- nhân công
alter table m4.price_items add column if not exists cost_depreciation double precision default 0; -- khấu hao thiết bị
alter table m4.price_items add column if not exists cost_overhead     double precision default 0; -- quản lý, điện nước

-- Báo giá: quy trình Nháp → Chờ duyệt → Đã duyệt → Đã gửi → Được chấp nhận | Từ chối | Hết hạn
alter table m4.quotations add column if not exists submitted_by  text;          -- email người trình duyệt
alter table m4.quotations add column if not exists submitted_at  timestamptz;
alter table m4.quotations add column if not exists approved_by   text;          -- họ tên người duyệt
alter table m4.quotations add column if not exists approved_at   timestamptz;
alter table m4.quotations add column if not exists decision_note text;          -- lý do trả lại / khách từ chối

-- Dòng báo giá (lấy từ bảng giá hoặc nhập tay)
create table if not exists m4.quotation_lines (
  id             uuid primary key default gen_random_uuid(),
  quotation_id   uuid not null references m4.quotations(id) on delete cascade,
  price_item_id  uuid references m4.price_items(id) on delete set null,
  description    text not null,
  unit           text default 'mẫu',
  quantity       double precision default 1,
  unit_price     double precision default 0,      -- VND, chưa thuế
  discount_pct   double precision default 0,      -- % giảm giá
  unit_cost      double precision default 0,      -- giá thành định mức / đơn vị tại thời điểm báo giá
  sort_order     integer default 0,
  created_at     timestamptz default now()
);
create index if not exists idx_quotation_lines_quotation_id on m4.quotation_lines(quotation_id);

-- Hợp đồng: thời hạn trả kết quả, thanh toán và thông tin giao kết quả
alter table m4.contracts add column if not exists result_due_at      date;
alter table m4.contracts add column if not exists payment_due_at     date;
alter table m4.contracts add column if not exists delivered_at       date;
alter table m4.contracts add column if not exists delivery_method    text;  -- Trực tiếp | Bưu điện | Email | Cổng trực tuyến
alter table m4.contracts add column if not exists delivery_recipient text;

-- Hóa đơn điện tử
create table if not exists m4.invoices (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,          -- số hóa đơn (hoặc mã nháp khi chưa phát hành)
  series           text,                          -- ký hiệu hóa đơn, VD: 1C26TVN
  contract_id      uuid references m4.contracts(id) on delete set null,
  issued_at        date,
  amount           double precision default 0,    -- tiền trước thuế
  vat_rate         double precision default 8,
  buyer_name       text,
  buyer_tax_code   text,
  buyer_address    text,
  status           text default 'Nháp',           -- Nháp | Đã phát hành | Đã thay thế | Đã hủy
  provider         text default 'Nhập tay',       -- Nhập tay | VNPT | Viettel | MISA | …
  lookup_code      text,                          -- mã tra cứu hóa đơn
  lookup_url       text,
  note             text,
  created_at       timestamptz default now()
);
create index if not exists idx_invoices_contract_id on m4.invoices(contract_id);

-- Nhật ký chăm sóc khách hàng (quan hệ khách hàng)
create table if not exists m4.customer_interactions (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  occurred_at     date default current_date,
  kind            text default 'Gọi điện',        -- Gọi điện | Gặp trực tiếp | Email | Hội thảo – tập huấn | Khiếu nại | Khảo sát hài lòng
  content         text not null,
  staff           text,
  next_action     text,
  next_action_at  date,
  note            text,
  created_at      timestamptz default now()
);
create index if not exists idx_customer_interactions_customer_id on m4.customer_interactions(customer_id, occurred_at desc);
