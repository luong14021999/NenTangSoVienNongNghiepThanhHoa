# Kiến trúc – LIMS Viện Nông Nghiệp Thanh Hóa

## Stack hiện tại (test mode)
| Tầng | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind v4 · Radix UI |
| Backend / API | Next.js Route Handlers + Server Components |
| **Storage** | **File JSON trong `data/` folder** – persist khi server restart, không cần DB |
| Database | Neon Postgres (`@neondatabase/serverless`, schema trong `db/migrations/`) – bật khi có `DATABASE_URL` |
| Auth | Neon Auth (`@neondatabase/auth`, dựa trên Better Auth) – bật khi có `NEON_AUTH_BASE_URL` |

## Cấu trúc thư mục

```
.
├── public/                       # Static assets (logo, PWA manifest)
├── data/                         # ★ File storage – JSON theo collection (gitignore)
│   ├── customers.json
│   └── ...
├── db/                           # Neon Postgres
│   ├── migrations/*.sql          # schema (chạy bằng npm run db:migrate)
│   ├── migrate.ts
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/                  # Route handlers (GET/POST/PATCH/DELETE)
│   │   └── ...                   # UI pages
│   ├── components/
│   ├── lib/
│   │   ├── mock-data.ts          # Fallback ban đầu khi data/ trống
│   │   ├── storage/file-storage.ts   # ★ Read/write JSON files
│   │   ├── db.ts                 # Neon client (DATABASE_URL)
│   │   ├── auth/server.ts        # Neon Auth (server, proxy, handler)
│   │   ├── auth/client.ts        # Neon Auth (client: signIn, signOut, useSession)
│   │   └── data/customers.ts     # Data access layer
│   └── types/database.ts
└── docs/
```

## File Storage (mode hiện tại)

Đơn giản nhất, không cần cloud / database. Mỗi entity = 1 file JSON.

### Cách hoạt động
1. Lần đầu page load: `readCollection('customers', mockCustomers)` thấy file chưa có → ghi mock data vào `data/customers.json`
2. Lần sau: đọc trực tiếp từ file → nhanh, persist khi server restart
3. Write (POST/PATCH/DELETE) qua API → ghi lại vào file

### API endpoints
```
GET    /api/customers          # danh sách
POST   /api/customers          # thêm 1 KH (body JSON)
PATCH  /api/customers/{id}     # sửa
DELETE /api/customers/{id}     # xóa
```

### Test thủ công với curl
```bash
# Lấy danh sách
curl http://localhost:3000/api/customers | jq

# Thêm KH
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"code":"KH-VNNTH-0999","name":"HTX Thí điểm","kind":"HTX / Trang trại"}'

# Sửa KH
curl -X PATCH http://localhost:3000/api/customers/{id} \
  -H "Content-Type: application/json" \
  -d '{"phone":"0900 000 000"}'

# Xóa
curl -X DELETE http://localhost:3000/api/customers/{id}
```

### Reset data về mock ban đầu
```bash
rm -rf data/
```
Lần page load tiếp theo sẽ tự sinh lại từ `src/lib/mock-data.ts`.

### Convert entity khác sang file storage
Pattern (copy từ `src/lib/data/customers.ts`):

```ts
import { readCollection, appendItem, updateItem, deleteItem }
  from "@/lib/storage/file-storage";
import { samples as mockSamples, type Sample } from "@/lib/mock-data";

const COLLECTION = "samples";

export async function getSamples() {
  return readCollection<Sample>(COLLECTION, mockSamples);
}

export async function createSample(s: Sample) {
  return appendItem(COLLECTION, s, mockSamples);
}
// ...
```

Sau đó update page tương ứng thành `async function` và `await getSamples()`.

## Setup Neon (lần đầu)

### 1. Tạo project
- Vào https://console.neon.tech → New Project, chọn region gần nhất (Singapore cho Việt Nam)
- **Connection string** (Dashboard → Connect, bản *pooled*) → `DATABASE_URL`

### 2. Bật Neon Auth
- Trong project → **Auth** → bật Neon Auth
- **Settings → Better Auth → Project Info** → copy Auth URL → `NEON_AUTH_BASE_URL`
- Tạo cookie secret (≥ 32 ký tự): `openssl rand -base64 32` → `NEON_AUTH_COOKIE_SECRET`

### 3. Cấu hình env
```bash
cp .env.local.example .env.local
# Điền 3 giá trị trên
```

### 4. Chạy migration + seed
```bash
npm run db:migrate   # chạy các file db/migrations/*.sql chưa áp dụng
npm run db:seed      # đổ mock data từ src/lib/mock-data.ts vào DB mới (chỉ insert)
npm run db:seed -- --reset   # XOÁ dữ liệu cũ trong các bảng rồi seed lại
```

### 5. Tạo tài khoản đăng nhập
App không có trang đăng ký – tạo user trong Neon Console (Auth → Users).

### 6. Verify
```bash
npm run dev
```
Mở [http://localhost:3000/customers](http://localhost:3000/customers) — badge "Dữ liệu live từ Neon" hiển thị nếu kết nối OK. Nếu chưa có `DATABASE_URL`, dữ liệu đọc/ghi từ `data/*.json` (fallback). Nếu chưa cấu hình Neon Auth, mọi trang đều mở (không cần đăng nhập).

## Schema (24 bảng)

Nhóm theo module:

| Nhóm | Bảng |
|---|---|
| **Khách hàng & TT** | `customers` · `customer_feedback` · `services` |
| **Nguồn lực** | `staff` · `equipment` + `equipment_usage_logs` + `maintenance_schedule` + `environment_readings` · `tools` · `chemicals` + `chemical_usage_logs` |
| **Nghiệp vụ mẫu** | `test_requests` · `samples` · `archived_samples` · `sampling_sessions` + `field_samples` · `campaigns` |
| **Phân tích & KQ** | `analysis_results` + `analysis_audit_events` |
| **Đảm bảo chất lượng** | `qc_charts` + `qc_points` · `external_qc_rounds` · `risks` + `opportunities` · `decision_rules` |

## Data Access Layer

Mỗi entity có 1 file trong `src/lib/data/`:

```ts
// src/lib/data/customers.ts
export const customersStore = createEntityStore<Customer>("customers", mockCustomers, {
  table: "customers",
  select: "id, code, name, ...",
  toEntity: (row) => ({ /* snake_case → camelCase */ }),
  toRow: (c) => ({ /* camelCase → snake_case */ }),
});
```

**Pattern**: pages là server components, gọi data loader bằng `await`. `createEntityStore` (`src/lib/data/factory.ts`) chạy SQL trên Neon khi có `DATABASE_URL`, ngược lại fallback về file JSON → dev experience không bị vỡ.

Để convert pages khác, copy pattern này cho:
- `samples` → `src/lib/data/samples.ts`
- `test-requests` → `src/lib/data/test-requests.ts`
- `equipment` → `src/lib/data/equipment.ts`
- ... v.v.

## Phân quyền

App truy cập DB từ server bằng `DATABASE_URL` (role owner), không bật RLS. Mọi trang (trừ `/login`) được `src/proxy.ts` chặn khi chưa đăng nhập Neon Auth. Phân quyền theo role (KTV/QA/Trưởng phòng/Khách) cần làm ở tầng API/server.

## Roadmap backend

| Giai đoạn | Mục |
|---|---|
| ✅ P1 | Schema 24 bảng + seed + 1 page (customers) wire DB |
| 🟡 P2 | Convert hết các pages list (samples, equipment, chemicals, …) sang fetch DB |
| 🟡 P2 | API routes `POST/PATCH/DELETE` cho CRUD |
| 🔵 P3 | Phân quyền theo role (KTV/QA/Trưởng phòng/Khách) |
| 🔵 P3 | Lưu trữ raw file + ảnh |
| 🔵 P4 | Realtime: dashboard cảnh báo live, sync mẫu hiện trường |

## Liên kết tham khảo
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)
- [Neon Auth + Next.js](https://neon.com/docs/auth/quick-start/nextjs)
