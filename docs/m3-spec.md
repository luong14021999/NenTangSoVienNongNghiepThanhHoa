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
| A | M3.1.1–M3.1.4: cây mẹ, lô môi trường, mẻ cấy (mẻ cha – con, hệ số nhân), thống kê nhiễm, phòng nuôi | Xong |
| B | M3.1.5–M3.1.6: đơn hàng, kế hoạch, vườn ươm; truy xuất từ cây mẹ; giá thành; xuất bán; phản hồi; báo cáo | Xong |
| C | M3.2.1–M3.2.3, M3.2.6: hồ sơ pháp lý, nguồn giống gốc, phả hệ, kiểm định – chứng nhận, sản xuất giống theo cấp | Xong |
| D | M3.2.4, M3.2.5, M3.2.7, M3.2.8: BLAST+ (máy chủ nội bộ), chỉ thị phân tử, bản đồ số, kết nối cung – cầu | Đang làm |

## Đợt A – thiết kế

| Chức năng | Cách làm |
|---|---|
| Cây mẹ (M3.1.1) | `m3_tissue.mother_plants`: nguồn gốc, nơi lưu giữ, tham chiếu mã nguồn gen (`m3_breed.germplasm`), kết quả kiểm tra sạch bệnh (phương pháp, tác nhân, mã mẫu M2). Vật liệu khởi đầu gắn cây mẹ; **không cho tạo vật liệu từ cây mẹ "Nhiễm bệnh"** |
| Môi trường (M3.1.2) | Định mức hóa chất / lít cho từng công thức (`recipe_chemicals`), tính lượng cần khi pha. Lô môi trường (`media_batches`): pha chế, pH, hấp tiệt trùng (nhiệt độ, thời gian, thời điểm), kiểm tra chất lượng, hạn dùng. Lô "Đạt" bắt buộc ghi thông số hấp |
| Mẻ cấy (M3.1.3) | Thêm mẻ cha (cấy chuyển), lô môi trường, tủ cấy, phòng nuôi, số mẫu đưa vào, số mẫu sống. Hệ số nhân = chồi ÷ mẫu đưa vào; tỷ lệ sống = mẫu sống ÷ mẫu đưa vào. **Chỉ dùng lô môi trường "Đạt" và còn hạn**; chặn mẻ cha tạo vòng lặp. Trang chi tiết mẻ hiện chuỗi cây mẹ → vật liệu → các mẻ cấy chuyển → mẻ con, lô ra ngôi |
| Thống kê (M3.1.4) | `/tissue-stats`: tỷ lệ nhiễm theo tháng, tủ cấy, người thao tác, lô môi trường, cây mẹ, công thức, giai đoạn. Tỷ lệ nhóm = tổng bình nhiễm ÷ tổng bình. Ngưỡng cảnh báo là cấu hình M1 `tissue_contamination_threshold` (mặc định 7%). Nhóm dưới 20 bình được ghi "ít mẫu" và không đưa vào danh sách cảnh báo |
| Phòng nuôi (M3.1.4) | `growth_rooms` có ngưỡng nhiệt độ, độ ẩm, ánh sáng; `room_readings` lưu số liệu. Thiết bị I.1.4 gửi qua `POST /api/v1/m3/room-readings` bằng khóa API phạm vi `m3:readings` (tối đa 500 lần đo mỗi gói, kiểm tra khoảng giá trị vật lý); có thể nhập tay. Biểu đồ 72 giờ, cảnh báo ngoài ngưỡng, cảnh báo thiết bị mất tín hiệu (> 2 giờ không có số liệu) |

## Đợt B – thiết kế

| Chức năng | Cách làm |
|---|---|
| Thông số sản xuất | `production_profiles` theo loài/giống: hệ số nhân mỗi lần cấy chuyển, chu kỳ, số ngày ra rễ, số ngày vườn ươm, tỷ lệ sống in vitro, tỷ lệ sống vườn ươm, tỷ lệ Loại 1 |
| Đơn hàng | `orders`: khách hàng (`public.customers`), hợp đồng M4 (tùy chọn), giống, số lượng, yêu cầu loại, ngày giao, mùa vụ, đơn giá. Mẻ cấy và lô ra ngôi gắn đơn hàng |
| Kế hoạch tính ngược | Cây cần giao ÷ tỷ lệ Loại 1 (nếu yêu cầu Loại 1) ÷ tỷ lệ sống vườn ươm = cây phải ra ngôi; ÷ tỷ lệ sống in vitro = chồi phải ra rễ; số lần cấy chuyển n = ⌈log(chồi cần ÷ chồi sẵn có) ÷ log(hệ số nhân)⌉. Hạn chót: ra ngôi = ngày giao − ngày vườn ươm; ra rễ = ra ngôi − ngày ra rễ; bắt đầu nhân = ra rễ − n × chu kỳ. Chồi sẵn có mặc định = chồi của các mẻ đang nuôi gắn đơn (nhập được để thử kịch bản) |
| Điều độ | `/production-schedule`: lịch theo tuần (4/8/12 tuần): cấy chuyển đến hạn, bắt đầu nhân, đưa ra rễ, ra ngôi theo kế hoạch, lô đủ tiêu chuẩn, giao hàng; mục quá hạn tách riêng |
| Vườn ươm | Lô ra ngôi thêm khu/luống, ngày đủ tiêu chuẩn, số cây Loại 1 / Loại 2 / không đạt (tổng không vượt số cây sống) |
| Kho vật tư | `supplies` (đơn vị tồn kho = đơn vị định giá, đơn giá, tồn tối thiểu) + `supply_moves` (Nhập / Xuất / Kiểm kê điều chỉnh). Không xuất quá tồn; nhập có giá → cập nhật đơn giá; phiếu chỉ xóa, không sửa |
| Giá thành | Chi phí môi trường / lít = Σ định mức × đơn giá vật tư (quy đổi mg↔g↔kg, µl↔ml↔l). Chi phí 1 bình = chi phí lô môi trường ÷ số bình đã rót. Mẻ: (chồi nhận từ mẻ cha × giá thành chồi mẻ cha + số bình × (môi trường + nhân công + chi phí chung)) ÷ chồi thu được. Lô: số cây ra ngôi × giá thành chồi + chi phí vườn ươm / cây; giá thành / cây = tổng ÷ cây sống. Đơn giá nhân công, chi phí chung, vườn ươm là cấu hình M1 |
| Truy xuất QR | `/trace/[mã lô]` đi ngược mọi lần cấy chuyển (truy vấn đệ quy, tối đa 50 đời, chặn vòng lặp) đến vật liệu và cây mẹ (kết quả sạch bệnh). Không công bố khách hàng, người cấy, tủ cấy, giá |
| Xuất bán | `lot_sales`: một lô xuất nhiều lần; không xuất quá số cây sống còn lại; khách hàng và đơn giá lấy theo đơn hàng nếu để trống. Dữ liệu xuất cũ ghi trên lô được chuyển thành phiếu `PX-CU-<mã lô>` |
| Phản hồi | `lot_feedback`: cán bộ ghi hoặc khách gửi từ trang QR (`POST /api/public/lot-feedback`, honeypot, giới hạn 5 lần/giờ/IP và 200 lần/ngày) |
| Báo cáo | `/tissue-reports`: cây ra ngôi, đã bán, doanh thu theo tháng; theo giống; giá thành – lãi theo lô; tỷ lệ giao đúng hạn; hài lòng. Xuất CSV `/api/m3-reports/tissue` |

## Đợt C – thiết kế

| Chức năng | Cách làm |
|---|---|
| Hồ sơ pháp lý (M3.2.1) | `varieties` thêm phạm vi (giống của Viện / giống trên địa bàn tỉnh), hình thức lưu hành, số và ngày lưu hành, văn bằng bảo hộ (liên kết `m4.ip_assets`), vùng khuyến cáo, diện tích. `variety_documents`: quyết định công nhận, lưu hành, bản tự công bố, văn bằng, hợp quy…; cảnh báo trước 90 ngày khi hết hiệu lực. Trang hồ sơ giống `/varieties/[id]` gom văn bản, nguồn giống gốc, khảo nghiệm, lô sản xuất, lô giống |
| Nguồn giống gốc (M3.2.2) | `source_stocks`: cây đầu dòng, vườn đầu dòng, đàn giống gốc / ông bà / bố mẹ / hậu bị, quyết định công nhận và hiệu lực. `individuals`: cá thể có bố, mẹ, thế hệ. Bố phải là Đực, mẹ phải là Cái, không trùng, không tạo vòng. **Hệ số cận huyết Wright** = hệ số thân thuộc của bố và mẹ (thuật toán đệ quy có ghi nhớ); cảnh báo từ 6,25%. Phả hệ 3 đời, đời con. `selection_records`: chỉ tiêu chọn lọc theo thời gian, quyết định chọn / loại |
| Bộ chỉ tiêu (M3.2.3) | `standards` + `standard_criteria` (tối thiểu / tối đa; để trống = không giới hạn, 0 là đúng bằng 0 – form hỗ trợ ô số để trống nhờ kiểu cột `optnum`). Viện tự nhập số hiệu quy chuẩn, tiêu chuẩn đang áp dụng |
| Khảo nghiệm (M3.2.3) | `trials` gắn bộ chỉ tiêu; `trial_observations` ghi số đo; tự đối chiếu (khớp tên không dấu, không phân biệt hoa thường) → Đạt / Không đạt / Chưa đủ số liệu |
| Kiểm định, chứng nhận (M3.2.3) | `seed_lots`: cấp giống, lô sản xuất nguồn, bộ chỉ tiêu, **mã mẫu M2** (chỉ dùng kết quả đã duyệt để đối chiếu), kiểm định ruộng / đàn, giấy chứng nhận, hợp quy và hiệu lực. "Đã chứng nhận" bắt buộc có số và ngày chứng nhận |
| Sản xuất theo cấp (M3.2.6) | `production_lots`: cấp sản xuất ra, nguồn là lô giống cấp trên hoặc nguồn giống gốc. **Lô nguồn phải cùng giống, đã đạt kiểm định và ở cấp cao hơn** (thứ bậc: tác giả → siêu nguyên chủng → nguyên chủng → xác nhận 1 / xác nhận → xác nhận 2; cụ kỵ → ông bà → bố mẹ → thương phẩm). `production_logs`: nhật ký, chi phí. Năng suất = sản lượng ÷ quy mô; giá thành = (chi phí lô + chi phí nhật ký) ÷ sản lượng |
| Cung ứng (M3.2.6) | `demands` theo địa phương, mùa vụ; cân đối với sản lượng kế hoạch / thực tế theo giống – mùa vụ – đơn vị. `orders` + `deliveries`: **chỉ giao lô Đạt / Đã chứng nhận, còn hiệu lực hợp quy, không vượt lượng còn lại** |
| Truy xuất QR | Cùng trang `/trace/[mã]`: không phải lô cây giống nuôi cấy mô thì tra `seed_lots`, hiện giống, cấp, công nhận, lưu hành, chứng nhận, hợp quy, chuỗi cấp giống đến nguồn giống gốc. Tem QR `/seed-lot-labels` |

## Đợt D – thiết kế

| Chức năng | Cách làm |
|---|---|
| BLAST+ (M3.2.4) | Dịch vụ riêng `services/blast` (Node.js không phụ thuộc thư viện + ncbi-blast+, có Dockerfile), chạy trên máy chủ bất kỳ của Viện. **Trình tự chỉ lưu trên đĩa máy chủ đó.** Web gọi qua `BLAST_SERVICE_URL` + `BLAST_SERVICE_TOKEN`; chỉ lưu `sequence_refs` (mã, loại, gen, giống / nguồn gen, độ dài, sha256) và `blast_searches` (nhãn, độ dài, sha256 truy vấn, bảng hit). Bảo vệ: token bắt buộc (so sánh hằng thời gian), chỉ nhận ký hiệu IUPAC, mã trình tự `[A-Za-z0-9._-]`, gọi lệnh không qua shell (`execFile`), giới hạn 2 MB, 2 lượt song song, 120 giây. Chưa cấu hình → hiện "chưa kết nối", **không mô phỏng**. Đã kiểm thử với BLAST+ 2.17.0 thật |
| Chỉ thị phân tử (M3.2.5) | `markers` (SSR / SNP / mã vạch ADN), `genotype_samples` (giống tham chiếu / mẫu cần nhận dạng / cây kiểm tra độ thuần), `genotype_calls` (alen 1, alen 2; trống = đồng hợp), nhập bằng cách dán từ Excel. Hồ sơ chuẩn của giống = gộp các mẫu tham chiếu. Độ tương đồng = tỷ lệ alen chung trung bình trên chỉ thị chung; **nhận dạng** cần ≥ 3 chỉ thị (Trùng khớp = 100%, Rất gần ≥ 90%, Gần giống ≥ 75%). **Độ thuần** = cây khớp hoàn toàn ÷ cây đủ số liệu; hiện cả ở trang lô giống |
| Bản đồ số (M3.2.7) | `facilities` (của Viện / liên kết, tọa độ kiểm tra trong lãnh thổ Việt Nam, quy mô, năng lực, điều kiện, kiểm tra); bản đồ Leaflet 1.9.4 (CDN, có SRI) + nền OpenStreetMap; popup dựng bằng `textContent`. `distributions`: diện tích / quy mô giống theo huyện – năm. Lô sản xuất gắn cơ sở |
| Chỉ tiêu cho Sở NN&MT, IOC | Dịch vụ LGSP `chi-tieu-giong` (bộ kết nối M1, mô phỏng khi chưa cấu hình) và `GET /api/v1/m3/breed-indicators?year=` (khóa API phạm vi `breed:read`). Chỉ số liệu tổng hợp: giống công nhận / lưu hành, sản xuất theo cấp, cơ sở sản xuất, phân bố giống – không có khách hàng, giá |
| Cung – cầu, thị trường (M3.2.8) | Giống thêm `is_public`, mô tả ngắn, quy trình kỹ thuật kèm giống (kho tri thức M4.5, mục đã công bố). `market_posts`: thông tin thị trường, mô hình hiệu quả, tiến bộ kỹ thuật, nguồn giống, hỗ trợ sau cung ứng. Cổng công khai `/portal/giong`: giống giới thiệu, lô đạt chuẩn còn cung ứng (không giá), tin công bố; nút đăng ký nhu cầu mở form yêu cầu M4 đã điền sẵn loại dịch vụ |
| Sửa chung | Trùng mã / khóa duy nhất trả 409 kèm thông báo (trước đây 500, hoặc 404 khi sửa) |
