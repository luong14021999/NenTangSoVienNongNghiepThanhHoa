# M3 – Quản lý và phát triển giống cây trồng, vật nuôi, thủy sản

Quản lý thống nhất hoạt động về giống của Viện. Gồm hai phân hệ, dùng chung mã định danh và cơ sở dữ liệu giống. Dữ liệu giống và nuôi cấy mô được lưu trữ tại Viện.

## M3.1 – Quản trị chuỗi sản xuất giống nuôi cấy mô và truy xuất nguồn gốc

**Mục đích:**
- Đưa tỷ lệ nhiễm mẫu về mức kỹ thuật **5–7%**, nhờ xác định nguyên nhân theo tủ cấy, người thao tác, mẻ môi trường.
- Mỗi lô cây xuất vườn **truy nguyên được đến vật liệu khởi đầu**.
- Lập kế hoạch sản xuất theo đơn hàng và tính được giá thành lô giống.

| Mã | Chức năng | Nội dung |
|---|---|---|
| M3.1.1 | Vật liệu khởi đầu và cây mẹ | Hồ sơ nguồn giống, mã nguồn gen (tham chiếu phần mềm Nguồn gen), kết quả kiểm tra sạch bệnh |
| M3.1.2 | Môi trường nuôi cấy | Công thức theo giống, giai đoạn; định mức hóa chất; pha chế, hấp tiệt trùng, kiểm tra chất lượng theo lô |
| M3.1.3 | Mẻ cấy theo giai đoạn | Số lần cấy chuyển, hệ số nhân, tỷ lệ nhiễm, tỷ lệ sống |
| M3.1.4 | Thống kê, cảnh báo | Tổng hợp tỷ lệ nhiễm theo tủ cấy, người thao tác, mẻ môi trường; cảnh báo khi vượt ngưỡng do Viện quy định; giám sát nhiệt độ, độ ẩm, ánh sáng phòng nuôi từ thiết bị đo tại hạng mục I.1.4 |
| M3.1.5 | Ra ngôi, vườn ươm | Phân loại chất lượng; kế hoạch, điều độ sản xuất theo đơn hàng, mùa vụ |
| M3.1.6 | Truy xuất, giá thành, xuất bán | Truy xuất nguồn gốc bằng mã QR từ cây mẹ đến lô xuất vườn, công bố qua cổng tra cứu của M4; kho vật tư và giá thành; xuất bán, phản hồi khách hàng; báo cáo |

## M3.2 – Quản lý và phát triển giống cây trồng, vật nuôi, thủy sản

Mở rộng phạm vi quản lý sang toàn bộ giống do Viện nghiên cứu, chọn tạo, khảo nghiệm, sản xuất và cung ứng. Mục tiêu là rút ngắn khâu khảo nghiệm – chứng nhận – cung ứng để đưa nhanh giống mới vào sản xuất.

| Mã | Chức năng | Nội dung |
|---|---|---|
| M3.2.1 | Danh mục, lý lịch, hồ sơ pháp lý giống | Nguồn gốc, đặc tính, tác giả; tình trạng công nhận, lưu hành, bảo hộ; dữ liệu giống trên địa bàn tỉnh |
| M3.2.2 | Nguồn giống gốc, cây đầu dòng, đàn giống bố mẹ | Cây đầu dòng, vườn đầu dòng; đàn giống gốc, đàn bố mẹ vật nuôi, thủy sản; phả hệ, chỉ tiêu chọn lọc |
| M3.2.3 | Khảo nghiệm, kiểm định, chứng nhận giống | Bộ chỉ tiêu theo quy chuẩn, tiêu chuẩn; kết quả kiểm nghiệm lô giống từ M2; hồ sơ hợp quy và hiệu lực |
| M3.2.4 | Công cụ BLAST+ cài đặt cục bộ đối soát trình tự gen | Tra cứu, đối soát trình tự ADN/ARN trên hệ thống nội bộ của Viện; **không gửi dữ liệu ra máy chủ công cộng**, bảo đảm bí mật dữ liệu nguồn gen theo Nghị định 59/2017/NĐ-CP |
| M3.2.5 | Chỉ thị phân tử và đặc tính di truyền | Dữ liệu chỉ thị SSR, SNP, mã vạch ADN phục vụ nhận dạng, giám định độ thuần giống |
| M3.2.6 | Sản xuất giống theo cấp và cung ứng giống | Kế hoạch, lô sản xuất, nhật ký, tỷ lệ sống, năng suất, giá thành; nhu cầu theo địa phương, mùa vụ; đơn hàng, giao nhận; truy xuất nguồn gốc lô giống bằng mã QR |
| M3.2.7 | Bản đồ số cơ sở giống và phân bố giống | Cơ sở sản xuất giống của Viện và cơ sở liên kết: địa điểm, quy mô, năng lực, điều kiện sản xuất, kết quả kiểm tra; bản đồ số phân bố giống; cung cấp chỉ tiêu về giống cho Sở Nông nghiệp và Môi trường, IOC tỉnh qua M1 |
| M3.2.8 | Dịch vụ kỹ thuật giống, kết nối cung – cầu, thông tin thị trường | Giới thiệu nguồn giống, tiến bộ kỹ thuật, mô hình hiệu quả; quy trình kỹ thuật kèm giống; hỗ trợ sau cung ứng; kết nối cung – cầu, thông tin thị trường giống |

## Hiện trạng (sau commit e66d6f5)

| Chức năng | Đã có | Còn thiếu |
|---|---|---|
| M3.1.1 | Vật liệu khởi đầu: loài, giống, nguồn, loại mẫu cấy, khử trùng | Cây mẹ và hồ sơ nguồn giống; tham chiếu mã nguồn gen (M3.2); kết quả kiểm tra sạch bệnh |
| M3.1.2 | Công thức môi trường: nền, chất điều hòa sinh trưởng, đường, agar, pH | Định mức hóa chất; lô pha chế, hấp tiệt trùng, kiểm tra chất lượng theo lô |
| M3.1.3 | Mẻ cấy: giai đoạn, lần cấy chuyển, số bình, số bình nhiễm, số chồi | Hệ số nhân, tỷ lệ sống; mẻ cha – mẻ con (để truy nguyên khi cấy chuyển nhiều đời); tủ cấy, lô môi trường |
| M3.1.4 | Tỷ lệ nhiễm chung | Thống kê theo tủ cấy, người thao tác, lô môi trường; ngưỡng cảnh báo cấu hình được; số liệu nhiệt độ, độ ẩm, ánh sáng từ thiết bị |
| M3.1.5 | Lô ra ngôi: số cây sống, phân loại, trạng thái | Đơn hàng; kế hoạch sản xuất tính ngược từ hệ số nhân; điều độ theo mùa vụ |
| M3.1.6 | QR truy xuất công khai (`/trace`), tem QR | Truy xuất từ cây mẹ; kho vật tư và giá thành lô; xuất bán gắn khách hàng / hợp đồng M4; phản hồi khách hàng; báo cáo |
| M3.2.1 | Lý lịch giống: nguồn gốc, tác giả, số QĐ công nhận | Lưu hành, bảo hộ (liên kết tài sản trí tuệ M4.6); dữ liệu giống trên địa bàn tỉnh |
| M3.2.2 | Nguồn gen (tập đoàn lưu giữ) | Cây đầu dòng, vườn đầu dòng, đàn giống gốc, bố mẹ; phả hệ; chỉ tiêu chọn lọc |
| M3.2.3 | Khảo nghiệm VCU / DUS / sản xuất thử | Bộ chỉ tiêu theo quy chuẩn; kiểm nghiệm lô giống liên kết mẫu M2; hồ sơ hợp quy, hiệu lực |
| M3.2.4–M3.2.8 | — | Chưa có |

## Ghi chú triển khai

- **M3.2.4 BLAST+** phải chạy trên máy chủ nội bộ của Viện hoặc Trung tâm dữ liệu tỉnh, không chạy trên Vercel và không dùng BLAST công cộng (NCBI). Lý do: dữ liệu nguồn gen phải giữ bí mật theo Nghị định 59/2017/NĐ-CP. Hệ thống trên Vercel chỉ lưu thông tin tham chiếu (mã mẫu, kết quả đối soát), không lưu và không gửi trình tự ra ngoài.
- **M3.2.3 / M3.2.5** dùng kết quả phân tích của M2. Chỉ lấy kết quả đã duyệt, giống cách M4.4 khai thác dữ liệu phòng thử nghiệm.
- **M3.2.7** gửi chỉ tiêu về giống cho Sở Nông nghiệp và Môi trường, IOC tỉnh qua bộ kết nối LGSP của M1. Bộ kết nối chạy chế độ mô phỏng cho đến khi có tài khoản thật.
- **M3.1.6 / M3.2.6** công bố truy xuất qua cổng tra cứu M4 (`/trace`), chỉ dữ liệu được phép công bố.

## Lộ trình

| Đợt | Phạm vi | Trạng thái |
|---|---|---|
| A | M3.1.1–M3.1.4: cây mẹ, lô môi trường, mẻ cấy (mẻ cha – con, hệ số nhân), thống kê nhiễm, phòng nuôi | Đang làm |
| B | M3.1.5–M3.1.6: đơn hàng, kế hoạch, vườn ươm; truy xuất từ cây mẹ; giá thành; xuất bán; phản hồi; báo cáo | Kế hoạch |
| C | M3.2.1–M3.2.3, M3.2.6: hồ sơ pháp lý, nguồn giống gốc, phả hệ, kiểm định – chứng nhận, sản xuất giống theo cấp | Kế hoạch |
| D | M3.2.4, M3.2.5, M3.2.7, M3.2.8: BLAST+ (máy chủ nội bộ), chỉ thị phân tử, bản đồ số, kết nối cung – cầu | Kế hoạch |

## Đợt A – thiết kế

| Chức năng | Cách làm |
|---|---|
| Cây mẹ (M3.1.1) | `m3_tissue.mother_plants`: nguồn gốc, nơi lưu giữ, tham chiếu mã nguồn gen (`m3_breed.germplasm`), kết quả kiểm tra sạch bệnh (phương pháp, tác nhân, mã mẫu M2). Vật liệu khởi đầu gắn cây mẹ; **không cho tạo vật liệu từ cây mẹ "Nhiễm bệnh"** |
| Môi trường (M3.1.2) | Định mức hóa chất / lít cho từng công thức (`recipe_chemicals`), tính lượng cần khi pha. Lô môi trường (`media_batches`): pha chế, pH, hấp tiệt trùng (nhiệt độ, thời gian, thời điểm), kiểm tra chất lượng, hạn dùng. Lô "Đạt" bắt buộc ghi thông số hấp |
| Mẻ cấy (M3.1.3) | Thêm mẻ cha (cấy chuyển), lô môi trường, tủ cấy, phòng nuôi, số mẫu đưa vào, số mẫu sống. Hệ số nhân = chồi ÷ mẫu đưa vào; tỷ lệ sống = mẫu sống ÷ mẫu đưa vào. **Chỉ dùng lô môi trường "Đạt" và còn hạn**; chặn mẻ cha tạo vòng lặp. Trang chi tiết mẻ hiện chuỗi cây mẹ → vật liệu → các mẻ cấy chuyển → mẻ con, lô ra ngôi |
| Thống kê (M3.1.4) | `/tissue-stats`: tỷ lệ nhiễm theo tháng, tủ cấy, người thao tác, lô môi trường, cây mẹ, công thức, giai đoạn. Tỷ lệ nhóm = tổng bình nhiễm ÷ tổng bình. Ngưỡng cảnh báo là cấu hình M1 `tissue_contamination_threshold` (mặc định 7%). Nhóm dưới 20 bình được ghi "ít mẫu" và không đưa vào danh sách cảnh báo |
| Phòng nuôi (M3.1.4) | `growth_rooms` có ngưỡng nhiệt độ, độ ẩm, ánh sáng; `room_readings` lưu số liệu. Thiết bị I.1.4 gửi qua `POST /api/v1/m3/room-readings` bằng khóa API phạm vi `m3:readings` (tối đa 500 lần đo mỗi gói, kiểm tra khoảng giá trị vật lý); có thể nhập tay. Biểu đồ 72 giờ, cảnh báo ngoài ngưỡng, cảnh báo thiết bị mất tín hiệu (> 2 giờ không có số liệu) |
