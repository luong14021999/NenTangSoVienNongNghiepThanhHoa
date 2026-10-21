# Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa

Một ứng dụng Next.js (App Router) chia theo phân hệ – một mã nguồn, một cơ sở dữ liệu (Neon PostgreSQL), một lần đăng nhập.

| Phân hệ | Nội dung | Trạng thái |
|---|---|---|
| M1 | Nền tảng dùng chung: xác thực 2 lớp, danh mục dùng chung, API v1 + LGSP/NDXP, kho dữ liệu, điều hành, dự báo, an toàn thông tin, giám sát & sao lưu | Đang vận hành |
| M2 | LIMS – Phòng phân tích Đất, nước, phân bón và môi trường (VILAS 1501, ISO/IEC 17025) | Đang vận hành |
| M4 | Dịch vụ KH&CN, khách hàng, báo giá, hợp đồng, thanh toán | Đang xây dựng |
| M3.1 | Nuôi cấy mô & truy xuất nguồn gốc | Kế hoạch |
| M3.2 | Giống cây trồng, vật nuôi, thủy sản | Kế hoạch |

## Cấu trúc thư mục

```
src/
  proxy.ts                     đăng nhập bắt buộc + cổng xác thực 2 lớp
  app/
    (auth)/                    /login, /mfa
    (main)/                    giao diện có menu (layout chung)
      page.tsx                 trang chủ – chọn phân hệ
      (m1-nen-tang)/           trang M1
      (m2-lims)/               trang M2 (bảng điều khiển PTN: /lims)
      (m4-dich-vu)/            trang M4
    (print)/(m2-lims)/         trang in: phiếu kết quả, nhãn mẫu, xác minh QR
    api/
      auth/                    Neon Auth
      (m1)/ (m2)/ (m4)/        API nội bộ theo phân hệ
      (m1)/v1/                 API cho hệ thống bên ngoài (khóa API)
  components/
    ui/ layout/ crud/ common/  dùng chung
    platform/                  M1 (xác thực 2 lớp, khóa API, ký điện tử, phân quyền…)
    m2/ m4/                    riêng từng phân hệ
  lib/
    platform/                  db, auth, phân quyền, chữ ký, nhật ký, bảo mật, tích hợp, kho dữ liệu, dự báo
    modules/m2/                nghiệp vụ LIMS (dữ liệu, công thức tính, quy tắc phát hành…)
    modules/m4/                nghiệp vụ M4
    mock-data.ts               dữ liệu mẫu / kiểu dùng chung
db/
  migrations/                  SQL theo thứ tự (npm run db:migrate)
```

Thư mục dạng `(tên)` là *route group*: chỉ để tổ chức mã, **không** xuất hiện trong URL (VD `src/app/(main)/(m2-lims)/samples` → `/samples`).

## Lệnh thường dùng

```bash
npm run dev                         # chạy local http://localhost:3000
npm test                            # kiểm thử (vitest)
npm run db:migrate                  # áp dụng migration chưa chạy
npx tsx db/seed-mdm.ts              # khởi tạo danh mục dùng chung
npm run validate -- --by "Họ tên"   # lưu lần xác nhận phần mềm (ISO 17025 §7.11.2)
```

## Biến môi trường

| Biến | Bắt buộc | Mục đích |
|---|---|---|
| `DATABASE_URL` | ✓ | Neon PostgreSQL |
| `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` | ✓ | Đăng nhập (Neon Auth) |
| `MFA_SECRET` | nên có | Khóa mã hóa bí mật xác thực 2 lớp (mặc định dùng `NEON_AUTH_COOKIE_SECRET`) |
| `CRON_SECRET` | nên có | Xác thực tác vụ định kỳ `/api/cron/health` (Vercel Cron) |
| `LGSP_BASE_URL`, `LGSP_TOKEN`, `LGSP_AGENCY_CODE` | khi có tài khoản | Kết nối LGSP thật (thiếu → chế độ mô phỏng) |
| `NDXP_BASE_URL`, `NDXP_TOKEN`, `NDXP_AGENCY_CODE` | khi có tài khoản | Kết nối NDXP thật (thiếu → chế độ mô phỏng) |

Triển khai: Vercel (vùng Singapore) – mỗi lần push lên `main` tự triển khai.
