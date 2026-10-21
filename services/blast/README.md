# Dịch vụ BLAST+ nội bộ (M3.2.4)

Dịch vụ này cho phép tra cứu và đối soát trình tự ADN, ARN, protein **trên hệ thống nội bộ của Viện**. Theo Nghị định 59/2017/NĐ-CP, dữ liệu nguồn gen không được gửi ra máy chủ công cộng.

- **Trình tự chỉ lưu trên đĩa của máy chủ chạy dịch vụ này** (thư mục `/data`).
- **Nền tảng web chỉ lưu thông tin mô tả và bảng kết quả đối soát**: mã trình tự, độ dài, mã băm sha256, các hit. Trình tự gốc không được lưu.
- Dịch vụ **không gọi BLAST công cộng** (NCBI) hay bất kỳ dịch vụ bên ngoài nào.

## Chạy

Máy chủ cần Docker. Đặt ở đâu cũng được (tại Viện hoặc Trung tâm dữ liệu tỉnh), miễn là nền tảng web truy cập được qua HTTPS.

```bash
cd services/blast
docker build -t vnnth-blast .
docker run -d --name vnnth-blast --restart unless-stopped \
  -p 8088:8088 \
  -e BLAST_TOKEN="$(openssl rand -hex 24)" \
  -v vnnth-blast-data:/data \
  vnnth-blast
```

- `BLAST_TOKEN` bắt buộc, dài ít nhất 24 ký tự. Ghi lại giá trị này để cấu hình phía web.
- Đặt dịch vụ sau một reverse proxy có HTTPS (nginx, Caddy…). **Không mở cổng 8088 trực tiếp ra Internet** khi chưa có HTTPS.
- Sao lưu định kỳ volume `vnnth-blast-data`: đây là nơi duy nhất chứa trình tự.

## Kết nối nền tảng web

Đặt 2 biến môi trường trên Vercel (hoặc nơi chạy web), rồi triển khai lại:

| Biến | Giá trị |
|---|---|
| `BLAST_SERVICE_URL` | Địa chỉ HTTPS của dịch vụ, VD `https://blast.viennongnghiep.local` |
| `BLAST_SERVICE_TOKEN` | Đúng giá trị `BLAST_TOKEN` của dịch vụ |

Sau đó, trang **M3.2 → Đối soát trình tự (BLAST+)** sẽ chuyển sang "Đã kết nối".

## API

Mọi đường dẫn trừ `/health` đều cần header `Authorization: Bearer <BLAST_TOKEN>`.

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/health` | Trạng thái, phiên bản BLAST+, số trình tự |
| GET | `/sequences` | Danh sách trình tự (không trả nội dung trình tự) |
| POST | `/sequences` | `{ accession, molecule: "ADN" \| "ARN" \| "Protein", sequence }` – thêm / thay trình tự và dựng lại CSDL |
| DELETE | `/sequences/{accession}` | Xóa trình tự |
| POST | `/search` | `{ program: "blastn" \| "blastp", query, evalue?, maxHits? }` – trả bảng hit (`-outfmt 6`) |

**Giới hạn:**
- Body tối đa 2 MB; trình tự tối đa 1.000.000 ký tự.
- Chỉ nhận ký hiệu IUPAC; ARN được lưu dưới dạng ADN (U → T).
- Tối đa 2 lượt tìm chạy song song; mỗi lượt tối đa 120 giây.
