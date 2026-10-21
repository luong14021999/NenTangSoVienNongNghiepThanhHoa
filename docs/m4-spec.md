# M4 – Quản trị hoạt động nghiên cứu – dịch vụ – tra cứu khoa học và công nghệ

Quản lý nhiệm vụ khoa học và công nghệ theo vòng đời, kết quả nghiên cứu, nhân lực, hợp tác và chuyển giao. M4 hình thành kho tri thức số và cơ sở dữ liệu nền, quản lý vòng đời dịch vụ, và là **cổng tra cứu công khai duy nhất** của Hệ thống. Yêu cầu an toàn thông tin: **cấp độ 3**.

## Chức năng

| Mã | Chức năng | Nội dung |
|---|---|---|
| M4.1 | Cổng tiếp nhận dịch vụ trực tuyến | Tiếp nhận yêu cầu trực tiếp và trực tuyến, chuyển đến M2, M3 hoặc bộ phận tư vấn; tra cứu tình trạng yêu cầu; công bố năng lực, phạm vi công nhận, bảng giá, biểu mẫu |
| M4.2 | Quản lý dịch vụ | Bảng giá, định mức; báo giá, phê duyệt; hợp đồng; theo dõi thời hạn, cảnh báo trễ hạn; trả kết quả; kết nối hóa đơn điện tử; công nợ; quan hệ khách hàng; báo cáo doanh thu phục vụ phương án tự chủ tài chính |
| M4.3 | Tra cứu công khai | Xác thực phiếu kết quả; truy xuất nguồn gốc lô giống bằng mã QR |
| M4.4 | Quản trị nhiệm vụ | Danh mục đề tài, dự án trên địa bàn tỉnh để chống trùng lặp; vòng đời nhiệm vụ nội bộ (đề xuất, phê duyệt, kinh phí, tiến độ, nghiệm thu); thí nghiệm, khảo nghiệm đồng ruộng; lý lịch khoa học, nhân lực nghiên cứu; khai thác dữ liệu phòng thử nghiệm từ M2; báo cáo thống kê KH&CN định kỳ; kết nối CSDL quốc gia về KH&CN qua M1 |
| M4.5 | Kho tri thức số và dữ liệu nền | Kết quả đề tài, số liệu thí nghiệm, quy trình kỹ thuật, báo cáo tổng kết, tiêu chuẩn, quy chuẩn, thư viện phương pháp nghiên cứu; tìm kiếm toàn văn; liên kết đề tài – thí nghiệm – kết quả – tác giả; dữ liệu nền về đất đai, khí hậu, thủy văn, cơ cấu cây trồng – vật nuôi, hạ tầng nghiên cứu |
| M4.6 | Tài sản trí tuệ, hợp tác và chuyển giao | Văn bằng bảo hộ; đối tác, thỏa thuận, chương trình hợp tác; hợp đồng, biên bản chuyển giao; lớp tập huấn trực tuyến trên thiết bị tại Khoản mục I.2 |
| M4.7 | An toàn thông tin cấp độ 3 cho cổng dịch vụ trực tuyến | Kiểm soát truy cập, mã hóa đường truyền, chống giả mạo phiếu kết quả, tách dữ liệu công bố khỏi dữ liệu nội bộ, rà soát an toàn định kỳ; tường lửa ứng dụng web, chống tấn công từ chối dịch vụ của Trung tâm dữ liệu tỉnh |

## Lộ trình

| Đợt | Phạm vi | Trạng thái |
|---|---|---|
| 1 | M4.1 cổng tiếp nhận + M4.3 tra cứu công khai + M4.7 cho cổng | Đang làm |
| 2 | Hoàn thiện M4.2 (định mức, phê duyệt báo giá, cảnh báo trễ hạn, trả kết quả, hóa đơn điện tử, báo cáo doanh thu) | Kế hoạch |
| 3 | M4.4 quản trị nhiệm vụ KH&CN | Kế hoạch |
| 4 | M4.5 kho tri thức + M4.6 tài sản trí tuệ, hợp tác, chuyển giao | Kế hoạch |

## Đợt 1 – thiết kế

**Đường dẫn công khai.** Không cần đăng nhập; được khai báo trong `PUBLIC_PREFIXES` ở [proxy.ts](../src/proxy.ts).

| Đường dẫn | Nội dung |
|---|---|
| `/portal` | Năng lực, phạm vi công nhận VILAS, bảng giá đã công bố, biểu mẫu; ô xác minh phiếu kết quả và truy xuất lô giống |
| `/portal/request` | Gửi yêu cầu dịch vụ |
| `/portal/status` | Tra cứu tình trạng yêu cầu bằng mã yêu cầu + số điện thoại |
| `/trace/[mã lô]` | Truy xuất nguồn gốc lô cây giống (M3.1) |
| `/verify/[số phiếu]` | Xác minh phiếu kết quả (M2, đã có) |
| `/api/public/*` | API của cổng |

**Định tuyến yêu cầu.** Hệ thống tự gán đơn vị xử lý theo loại dịch vụ khách chọn:

| Loại dịch vụ | Đơn vị xử lý |
|---|---|
| Phân tích – thử nghiệm | M2 – Phòng Phân tích và Thí nghiệm |
| Nuôi cấy mô – cây giống | M3.1 – Nuôi cấy mô |
| Giống cây trồng, vật nuôi, thủy sản | M3.2 – Giống |
| Tư vấn, chuyển giao và các loại khác | Bộ phận tư vấn |

Cán bộ có thể đổi đơn vị xử lý ở trang nội bộ `/service-requests`.

**Biện pháp M4.7 cho cổng.**
- **Dữ liệu tối thiểu:** trang công khai chỉ đọc qua các hàm riêng, trả về đúng những trường được phép công bố.
  - Truy xuất lô giống không hiện khách hàng.
  - Tra cứu yêu cầu chỉ hiện trạng thái, đơn vị xử lý và phản hồi công khai.
  - Bảng giá và biểu mẫu chỉ hiện mục đã đánh dấu "công bố".
- **Không dò được mã:** mã yêu cầu sinh ngẫu nhiên. Tra cứu phải có cả mã và số điện thoại. Khi sai, hệ thống trả cùng một thông báo, không cho biết mã có tồn tại hay không.
- **Giới hạn tần suất:** đếm theo IP đã băm (có salt, không lưu IP gốc).
  - Gửi yêu cầu: tối đa 5 lần/giờ/IP và 300 lần/ngày toàn cổng.
  - Tra cứu: tối đa 30 lần/giờ/IP.
- **Chống bot:** ô ẩn (honeypot); kiểm tra độ dài và định dạng từng trường.
- **Chống giả mạo phiếu kết quả:** băm nội dung + ký điện tử (M2, đã có).
- **Hạ tầng (cấu hình ngoài mã nguồn):**
  - HTTPS và header bảo mật đã có (M1.7).
  - Bật Vercel Firewall (WAF, Attack Challenge Mode) cho `/portal` và `/api/public/`.
  - Khi chuyển về Trung tâm dữ liệu tỉnh, dùng WAF và chống DDoS của Trung tâm.
