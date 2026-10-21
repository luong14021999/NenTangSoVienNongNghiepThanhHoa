# Quy ước cơ sở dữ liệu

Toàn bộ nền tảng dùng **một database Neon PostgreSQL**. Mỗi phân hệ có **schema riêng**. Tách theo schema giữ ranh giới rõ ràng giữa các phân hệ mà vẫn dùng được khóa ngoại, JOIN và giao dịch giữa chúng.

## Schema

| Schema | Phân hệ | Nội dung |
|---|---|---|
| `public` | M1 + M2 (cũ) | Dữ liệu dùng chung: người dùng, phân quyền, danh mục, nhật ký thay đổi, **khách hàng**. Các bảng LIMS đã có từ trước vẫn giữ ở đây và không di chuyển. |
| `analytics` | M1 | Kho dữ liệu (fact/dim), chỉ dùng để đọc cho báo cáo. |
| `m4` | M4 | Báo giá, hợp đồng, thanh toán, công nợ. |
| `m3_tissue` | M3.1 | Vật liệu khởi đầu, công thức môi trường, mẻ cấy, lô cây giống (truy xuất nguồn gốc). |
| `m3_breed` | M3.2 | Lý lịch giống, nguồn gen, khảo nghiệm. |

**Bảng mới của phân hệ phải tạo trong schema của phân hệ đó, không tạo trong `public`.**

## Đặt tên

- **Bảng:** `snake_case`, danh từ số nhiều tiếng Anh. Ví dụ: `quotations`, `culture_batches`.
- **Cột:** `snake_case`.
- **Khóa chính:** `id uuid primary key default gen_random_uuid()`.
- **Mã nghiệp vụ:** `code text unique not null`, có tiền tố. Ví dụ: `BG-2026-001`, `ME-2026-001`.
- **Khóa ngoại:** `<bảng số ít>_id`. Ví dụ: `customer_id`, `batch_id`.
- **Ngày:** đặt tên `*_at`, kiểu `date` (ngày nghiệp vụ) hoặc `timestamptz` (thời điểm hệ thống).
- **Tiền VND:** `double precision`, lưu số nguyên đồng. Postgres trả kiểu này về dạng `number`, nên không cần ép kiểu khi đọc.
- **Trạng thái:** `status text default '…'`, kèm comment liệt kê các giá trị hợp lệ. Danh sách giá trị khai báo một lần trong TypeScript (`as const`).
- **Cột bắt buộc có:** `note text` và `created_at timestamptz default now()`.
- **Chỉ mục:** `idx_<bảng>_<cột>`.

## Liên kết giữa các schema

- Bảng trong schema phân hệ **được phép** tham chiếu bảng dùng chung ở `public`. Ví dụ: `m4.contracts.customer_id → public.customers`.
- `public` **không** tham chiếu ngược vào schema phân hệ.
- Hai phân hệ chỉ tham chiếu lẫn nhau khi thật sự cần, và luôn dùng `on delete set null`.

## Trong mã nguồn

- Khai báo kho dữ liệu bằng `createEntityStore` + `columnsMapping("<schema>.<bảng>", …)`. Tên bảng không có schema thì mặc định là `public`.
- Kiểu cột `ref` dùng cho khóa ngoại uuid. Khi chưa chọn, giá trị ghi là `null` thay cho chuỗi rỗng.
- Mỗi collection mới phải có:
  - quyền ghi trong `ENTITY_PERMISSION` ([permissions.ts](../src/lib/platform/permissions.ts));
  - nhãn hiển thị trong `ENTITY_LABELS` ([change-log.ts](../src/lib/platform/data/change-log.ts));
  - mục menu trong [nav-config.tsx](../src/components/layout/nav-config.tsx).
- Thư mục theo phân hệ:
  - trang: `src/app/(main)/(m3-1-nuoi-cay-mo)/`, `src/app/(main)/(m3-2-giong)/`, `src/app/(main)/(m4-dich-vu)/`;
  - API: `src/app/api/(m3)/`, `src/app/api/(m4)/`;
  - nghiệp vụ: `src/lib/modules/m3/`, `src/lib/modules/m4/`.

## Migration

- Đặt tên file `db/migrations/NNNN_<mô_tả>.sql`, chạy bằng `npm run db:migrate`. Mỗi file chạy trong một transaction.
- Chỉ dùng câu lệnh chạy lại được nhiều lần (`create … if not exists`).
- Không sửa migration đã chạy. Muốn thay đổi thì viết file mới.
