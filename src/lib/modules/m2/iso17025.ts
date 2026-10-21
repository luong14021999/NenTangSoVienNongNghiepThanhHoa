// Cấu trúc điều khoản TCVN ISO/IEC 17025:2017 (≡ ISO/IEC 17025:2017).
// `summary` và `checks` là tóm tắt diễn giải để PTN tự đánh giá / đánh giá nội bộ,
// không phải nguyên văn tiêu chuẩn – khi đánh giá chính thức cần đối chiếu bản gốc.

export type IsoClause = {
  id: string;
  title: string;
  group: string;
  summary: string;
  checks: string[];
};

export const ISO_GROUPS = [
  "4. Yêu cầu chung",
  "5. Yêu cầu về cơ cấu",
  "6. Yêu cầu về nguồn lực",
  "7. Yêu cầu về quá trình",
  "8. Yêu cầu về hệ thống quản lý",
] as const;

export const isoClauses: IsoClause[] = [
  {
    id: "4.1", group: ISO_GROUPS[0], title: "Tính khách quan",
    summary: "Hoạt động PTN phải khách quan; nhận diện liên tục và loại bỏ/giảm thiểu rủi ro ảnh hưởng đến tính khách quan.",
    checks: ["Có cam kết khách quan của lãnh đạo và nhân viên", "Rủi ro về tính khách quan được nhận diện và có biện pháp xử lý"],
  },
  {
    id: "4.2", group: ISO_GROUPS[0], title: "Bảo mật",
    summary: "Bảo mật thông tin khách hàng thu được trong quá trình hoạt động; nhân viên có cam kết bảo mật.",
    checks: ["Nhân viên đã ký cam kết bảo mật", "Thông tin cung cấp cho bên thứ ba được thông báo cho khách hàng"],
  },
  {
    id: "5", group: ISO_GROUPS[1], title: "Yêu cầu về cơ cấu",
    summary: "PTN là pháp nhân hoặc thuộc pháp nhân; xác định phạm vi hoạt động, cơ cấu tổ chức, trách nhiệm và quyền hạn.",
    checks: ["Phạm vi hoạt động được lập thành văn bản", "Có sơ đồ tổ chức, trách nhiệm – quyền hạn của các vị trí"],
  },
  {
    id: "6.2", group: ISO_GROUPS[2], title: "Nhân sự",
    summary: "Yêu cầu năng lực từng vị trí; đào tạo, giám sát, ủy quyền và theo dõi năng lực nhân viên.",
    checks: ["Hồ sơ năng lực, đào tạo của từng nhân viên", "Ủy quyền thực hiện phép thử / phê duyệt kết quả", "Theo dõi năng lực định kỳ"],
  },
  {
    id: "6.3", group: ISO_GROUPS[2], title: "Cơ sở vật chất và điều kiện môi trường",
    summary: "Điều kiện môi trường phù hợp, được theo dõi, kiểm soát và ghi hồ sơ khi ảnh hưởng đến kết quả.",
    checks: ["Theo dõi nhiệt độ, độ ẩm phòng cân, phòng thiết bị", "Kiểm soát ra vào khu vực thử nghiệm"],
  },
  {
    id: "6.4", group: ISO_GROUPS[2], title: "Thiết bị",
    summary: "Thiết bị đủ, phù hợp; hiệu chuẩn theo chương trình, kiểm tra giữa kỳ, bảo trì và lưu hồ sơ thiết bị.",
    checks: ["Chương trình hiệu chuẩn được lập và thực hiện đúng hạn", "Hồ sơ lý lịch, bảo trì, sửa chữa thiết bị", "Thiết bị lỗi được cách ly, dán nhãn"],
  },
  {
    id: "6.5", group: ISO_GROUPS[2], title: "Liên kết chuẩn đo lường",
    summary: "Kết quả đo liên kết với chuẩn SI qua hiệu chuẩn được công nhận, mẫu chuẩn được chứng nhận (CRM).",
    checks: ["Giấy chứng nhận hiệu chuẩn từ tổ chức được công nhận", "CRM có chứng nhận, còn hạn"],
  },
  {
    id: "6.6", group: ISO_GROUPS[2], title: "Sản phẩm và dịch vụ do bên ngoài cung cấp",
    summary: "Xác định yêu cầu, đánh giá, lựa chọn, theo dõi và đánh giá lại nhà cung cấp hóa chất, dịch vụ hiệu chuẩn, PT.",
    checks: ["Danh sách nhà cung cấp được phê duyệt", "Hồ sơ đánh giá nhà cung cấp định kỳ", "Kiểm tra hàng hóa khi nhận"],
  },
  {
    id: "7.1", group: ISO_GROUPS[3], title: "Xem xét các yêu cầu, đề nghị thầu và hợp đồng",
    summary: "Xem xét yêu cầu khách hàng, năng lực đáp ứng, phương pháp, quy tắc quyết định trước khi chấp nhận.",
    checks: ["Phiếu yêu cầu/hợp đồng được xem xét và lưu", "Thông báo khách hàng khi có sai lệch so với hợp đồng"],
  },
  {
    id: "7.2", group: ISO_GROUPS[3], title: "Lựa chọn, kiểm tra xác nhận và xác nhận giá trị sử dụng của phương pháp",
    summary: "Dùng phương pháp phù hợp, cập nhật; kiểm tra xác nhận phương pháp tiêu chuẩn, xác nhận giá trị sử dụng phương pháp nội bộ.",
    checks: ["Hồ sơ kiểm tra xác nhận cho phương pháp TCVN/SMEWW", "Hồ sơ xác nhận giá trị sử dụng cho phương pháp AEMD-HD (LOD, LOQ, độ lặp lại, độ thu hồi)"],
  },
  {
    id: "7.3", group: ISO_GROUPS[3], title: "Lấy mẫu",
    summary: "Có kế hoạch và phương pháp lấy mẫu; ghi hồ sơ lấy mẫu (vị trí, thời gian, người lấy, điều kiện).",
    checks: ["Kế hoạch lấy mẫu", "Biên bản lấy mẫu đầy đủ thông tin"],
  },
  {
    id: "7.4", group: ISO_GROUPS[3], title: "Xử lý đối tượng thử nghiệm hoặc hiệu chuẩn",
    summary: "Vận chuyển, tiếp nhận, nhận dạng duy nhất, bảo quản, lưu và hủy mẫu; ghi nhận sai lệch khi tiếp nhận.",
    checks: ["Mã hóa mẫu duy nhất", "Điều kiện bảo quản và lưu mẫu được theo dõi"],
  },
  {
    id: "7.5", group: ISO_GROUPS[3], title: "Hồ sơ kỹ thuật",
    summary: "Hồ sơ kỹ thuật đủ để lặp lại hoạt động; ghi người thực hiện, người kiểm tra; lưu vết khi sửa đổi.",
    checks: ["Nhật ký phân tích ghi đầy đủ dữ liệu gốc", "Sửa đổi hồ sơ có lưu vết (audit trail)"],
  },
  {
    id: "7.6", group: ISO_GROUPS[3], title: "Đánh giá độ không đảm bảo đo",
    summary: "Nhận diện các thành phần đóng góp và đánh giá độ không đảm bảo đo cho các phép thử.",
    checks: ["Có bảng tính độ không đảm bảo đo cho từng chỉ tiêu"],
  },
  {
    id: "7.7", group: ISO_GROUPS[3], title: "Đảm bảo giá trị sử dụng của kết quả",
    summary: "Theo dõi giá trị sử dụng của kết quả: QC nội bộ, biểu đồ kiểm soát, thử nghiệm thành thạo, so sánh liên phòng.",
    checks: ["Biểu đồ kiểm soát cho từng chỉ tiêu", "Tham gia PT/so sánh liên phòng theo kế hoạch", "Phân tích xu hướng và xử lý khi vượt giới hạn"],
  },
  {
    id: "7.8", group: ISO_GROUPS[3], title: "Báo cáo kết quả",
    summary: "Phiếu kết quả chính xác, rõ ràng, đủ thông tin bắt buộc; nêu quy tắc quyết định khi công bố sự phù hợp.",
    checks: ["Phiếu kết quả có đủ thông tin theo §7.8.2", "Kết quả được xem xét và phê duyệt trước khi phát hành", "Công bố sự phù hợp nêu rõ quy tắc quyết định"],
  },
  {
    id: "7.9", group: ISO_GROUPS[3], title: "Khiếu nại",
    summary: "Có quá trình tiếp nhận, đánh giá, quyết định khiếu nại; thông báo kết quả xử lý cho người khiếu nại.",
    checks: ["Sổ theo dõi khiếu nại", "Khiếu nại được trả lời và đóng"],
  },
  {
    id: "7.10", group: ISO_GROUPS[3], title: "Công việc không phù hợp",
    summary: "Nhận diện, đánh giá mức ảnh hưởng, quyết định chấp nhận/thu hồi kết quả, thông báo khách hàng khi cần.",
    checks: ["Hồ sơ công việc không phù hợp", "Đánh giá ảnh hưởng đến kết quả đã phát hành"],
  },
  {
    id: "7.11", group: ISO_GROUPS[3], title: "Kiểm soát dữ liệu và quản lý thông tin",
    summary: "Hệ thống quản lý thông tin được xác nhận, bảo vệ khỏi truy cập trái phép, có sao lưu và lưu vết.",
    checks: ["Phân quyền truy cập theo vai trò", "Sao lưu dữ liệu", "Lưu vết sửa đổi"],
  },
  {
    id: "8.2", group: ISO_GROUPS[4], title: "Tài liệu hệ thống quản lý",
    summary: "Lập chính sách, mục tiêu; tài liệu hóa hệ thống quản lý; lãnh đạo cam kết.",
    checks: ["Sổ tay chất lượng, chính sách và mục tiêu chất lượng"],
  },
  {
    id: "8.3", group: ISO_GROUPS[4], title: "Kiểm soát tài liệu hệ thống quản lý",
    summary: "Tài liệu được phê duyệt trước khi ban hành, xem xét định kỳ, nhận biết phiên bản, thu hồi tài liệu lỗi thời.",
    checks: ["Danh mục tài liệu có phiên bản, ngày ban hành, người phê duyệt", "Tài liệu được soát xét định kỳ", "Tài liệu lỗi thời được nhận biết/thu hồi"],
  },
  {
    id: "8.4", group: ISO_GROUPS[4], title: "Kiểm soát hồ sơ",
    summary: "Hồ sơ rõ ràng, được lưu giữ, bảo vệ, có thời gian lưu và dễ truy xuất.",
    checks: ["Quy định thời gian lưu hồ sơ", "Hồ sơ lưu trên hệ thống, truy xuất được"],
  },
  {
    id: "8.5", group: ISO_GROUPS[4], title: "Hành động giải quyết rủi ro và cơ hội",
    summary: "Xem xét rủi ro và cơ hội; hoạch định hành động tương xứng và đánh giá hiệu lực.",
    checks: ["Sổ đăng ký rủi ro & cơ hội được cập nhật", "Hành động xử lý rủi ro có người phụ trách, thời hạn"],
  },
  {
    id: "8.6", group: ISO_GROUPS[4], title: "Cải tiến",
    summary: "Nhận diện cơ hội cải tiến; thu thập phản hồi của khách hàng để cải tiến.",
    checks: ["Thu thập ý kiến khách hàng định kỳ", "Theo dõi các hành động cải tiến"],
  },
  {
    id: "8.7", group: ISO_GROUPS[4], title: "Hành động khắc phục",
    summary: "Khi có sự không phù hợp: khắc phục, tìm nguyên nhân gốc, thực hiện hành động khắc phục, đánh giá hiệu lực.",
    checks: ["Phân tích nguyên nhân gốc", "Hành động khắc phục có thời hạn", "Đánh giá hiệu lực trước khi đóng"],
  },
  {
    id: "8.8", group: ISO_GROUPS[4], title: "Đánh giá nội bộ",
    summary: "Đánh giá nội bộ theo kế hoạch; chuyên gia khách quan; báo cáo kết quả cho lãnh đạo; lưu hồ sơ.",
    checks: ["Kế hoạch đánh giá nội bộ hằng năm bao trùm các điều khoản", "Chuyên gia độc lập với khu vực được đánh giá", "Phát hiện được xử lý bằng hành động khắc phục"],
  },
  {
    id: "8.9", group: ISO_GROUPS[4], title: "Xem xét của lãnh đạo",
    summary: "Lãnh đạo xem xét hệ thống quản lý định kỳ với đủ đầu vào bắt buộc; ghi nhận quyết định và hành động.",
    checks: ["Xem xét ít nhất 1 lần/năm", "Biên bản có đủ đầu vào §8.9.2 và đầu ra §8.9.3"],
  },
];

/** Đầu vào bắt buộc của xem xét lãnh đạo (§8.9.2 a–o) – tóm tắt diễn giải. */
export const managementReviewInputs = [
  { key: "a", label: "Thay đổi các vấn đề nội bộ và bên ngoài liên quan đến PTN" },
  { key: "b", label: "Việc thực hiện các mục tiêu" },
  { key: "c", label: "Sự phù hợp của chính sách và thủ tục" },
  { key: "d", label: "Tình trạng các hành động từ lần xem xét trước" },
  { key: "e", label: "Kết quả các cuộc đánh giá nội bộ gần đây" },
  { key: "f", label: "Hành động khắc phục" },
  { key: "g", label: "Đánh giá của tổ chức bên ngoài" },
  { key: "h", label: "Thay đổi về khối lượng, loại công việc hoặc phạm vi hoạt động" },
  { key: "i", label: "Phản hồi của khách hàng và nhân viên" },
  { key: "j", label: "Khiếu nại" },
  { key: "k", label: "Hiệu lực của các cải tiến đã thực hiện" },
  { key: "l", label: "Sự thỏa đáng của nguồn lực" },
  { key: "m", label: "Kết quả nhận diện rủi ro" },
  { key: "n", label: "Kết quả đảm bảo giá trị sử dụng của kết quả (QC, PT)" },
  { key: "o", label: "Các yếu tố liên quan khác (theo dõi hoạt động, đào tạo…)" },
] as const;
