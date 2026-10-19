// Danh mục phép thử được công nhận VILAS 1501
// Nguồn: Phụ lục kèm Quyết định số 1510/QĐ-VPCNCLQG ngày 09/06/2026
// của Giám đốc Văn phòng Công nhận chất lượng quốc gia (BoA),
// biểu mẫu AFL 01.12 – lần ban hành 6.26.
// Danh mục chính thức: chỉ sửa khi có quyết định công nhận mới.

export const labInfo = {
  vilasCode: "VILAS 1501",
  standard: "ISO/IEC 17025:2017",
  field: "Hóa",
  fieldEn: "Chemical",
  decisionNo: "1510/QĐ-VPCNCLQG",
  decisionDate: "2026-06-09",
  validFrom: "2026-06-09",
  validTo: "2031-06-08",
  accreditedName: "Phòng Phân tích và Thí nghiệm",
  accreditedNameEn: "Analysis experiment",
  organization: "Viện Nông nghiệp Thanh Hoá",
  organizationEn: "Thanh Hoa Agriculture Institute",
  manager: "Lê Anh Tùng",
  address: "271 Nguyễn Thục, phường Đông Quang, tỉnh Thanh Hoá",
  addressEn: "271 Nguyen Thuc, Dong Quang Ward, Thanh Hoa Province",
  phone: "02373.952.119",
  email: "phongpttn@gmail.com",
  website: "https://viennongnghiepthanhhoa.gov.vn",
} as const;

export type AccreditedMatrix =
  | "Đất"
  | "Nước mặt, nước ngầm"
  | "Nước mặt"
  | "Phân bón"
  | "Rau, quả";

export const matrixEn: Record<AccreditedMatrix, string> = {
  "Đất": "Soil",
  "Nước mặt, nước ngầm": "Surface water, ground water",
  "Nước mặt": "Surface water",
  "Phân bón": "Fertilizer",
  "Rau, quả": "Vegetables, fruits",
};

export type AccreditedTest = {
  no: number;
  matrix: AccreditedMatrix;
  name: string;
  nameEn: string;
  /** Giới hạn định lượng / phạm vi đo – "" nếu tài liệu để trống hoặc "-" */
  loq: string;
  method: string;
};

const OP_PESTICIDES =
  "Chlorpyrifos; Diazinon; Malthion; Ipropenfos; Dimethoate; Methyl parathion; Ethion; Fenthion; Dichorvos; Fenitrothion; Quinalphos; Anilofos";

export const accreditedTests: AccreditedTest[] = [
  // ── Đất / Soil ──────────────────────────────────────────
  { no: 1, matrix: "Đất", name: "Xác định độ ẩm và hệ số khô kiệt", nameEn: "Determination of humidity and absolute dryness coefficient", loq: "", method: "TCVN 4048:2011" },
  { no: 2, matrix: "Đất", name: "Xác định hàm lượng Cacbon hữu cơ tổng số – Phương pháp Walkley Black", nameEn: "Determination of total organic carbon – Walkley Black method", loq: "0,08%", method: "TCVN 8941:2011" },
  { no: 3, matrix: "Đất", name: "Xác định hàm lượng Sulfate hòa tan trong nước và trong axit", nameEn: "Determination of water-soluble and acid-soluble sulfate", loq: "0,02%", method: "TCVN 6656:2000" },
  { no: 4, matrix: "Đất", name: "Xác định hàm lượng Nitơ tổng số – Phương pháp Kjeldahl cải biên", nameEn: "Determination of total nitrogen – Modified Kjeldahl method", loq: "0,06 mg/g", method: "TCVN 6498:1999" },
  { no: 5, matrix: "Đất", name: "Xác định hàm lượng Kali tổng số", nameEn: "Determination of total potassium", loq: "0,024% K₂O", method: "TCVN 8660:2011" },
  { no: 6, matrix: "Đất", name: "Xác định hàm lượng kali dễ tiêu", nameEn: "Determination of bio-available potassium", loq: "5,00 mg/kg", method: "TCVN 8662:2011" },
  { no: 7, matrix: "Đất", name: "Xác định thành phần cấp hạt", nameEn: "Determination of particle size distribution", loq: "", method: "TCVN 8567:2010" },
  { no: 8, matrix: "Đất", name: "Xác định dung lượng cation trao đổi (CEC) – Phương pháp dùng amon axetat", nameEn: "Determination of cation exchange capacity (CEC) by ammonium acetate method", loq: "0,36 cmol(+)/kg", method: "TCVN 8568:2010" },
  { no: 9, matrix: "Đất", name: "Xác định hàm lượng Cu trong dịch chiết đất bằng cường thủy – Phương pháp F-AAS (Phương pháp A)", nameEn: "Determination of copper in aqua regia extracts of soil – F-AAS (Method A)", loq: "7,5 mg/kg", method: "TCVN 6496A:2009" },
  { no: 10, matrix: "Đất", name: "Xác định hàm lượng Zn trong dịch chiết đất bằng cường thủy – Phương pháp F-AAS (Phương pháp A)", nameEn: "Determination of zinc in aqua regia extracts of soil – F-AAS (Method A)", loq: "6,0 mg/kg", method: "TCVN 6496A:2009" },
  { no: 11, matrix: "Đất", name: "Xác định hàm lượng Cd trong dịch chiết đất bằng cường thủy – Phương pháp GF-AAS (Phương pháp B)", nameEn: "Determination of cadmium in aqua regia extracts of soil – GF-AAS (Method B)", loq: "0,02 mg/kg", method: "TCVN 6496B:2009" },
  { no: 12, matrix: "Đất", name: "Xác định hàm lượng Pb trong dịch chiết đất bằng cường thủy – Phương pháp GF-AAS (Phương pháp B)", nameEn: "Determination of lead in aqua regia extracts of soil – GF-AAS (Method B)", loq: "0,25 mg/kg", method: "TCVN 6496B:2009" },
  { no: 13, matrix: "Đất", name: "Xác định hàm lượng Cr trong dịch chiết đất bằng cường thủy – Phương pháp F-AAS (Phương pháp A)", nameEn: "Determination of chromium in aqua regia extracts of soil – F-AAS (Method A)", loq: "9,00 mg/kg", method: "TCVN 6496A:2009" },
  { no: 14, matrix: "Đất", name: "Xác định tổng hàm lượng và hàm lượng các ion thành phần muối hòa tan của đất trong phòng thí nghiệm", nameEn: "Determination of total content and content of composition ion of dissolvable salts in soil", loq: "0,025%", method: "TCVN 12615:2019" },
  { no: 15, matrix: "Đất", name: "Xác định khối lượng theo thể tích nguyên khối khô (Dung trọng)", nameEn: "Determination of dry bulk density", loq: "", method: "TCVN 6860:2001" },
  { no: 16, matrix: "Đất", name: "Xác định độ dẫn điện riêng (EC)", nameEn: "Determination of the specific electrical conductivity", loq: "1,36 mS/m", method: "TCVN 6650:2000" },
  { no: 17, matrix: "Đất", name: "Xác định hàm lượng phospho tổng số – Phương pháp so màu", nameEn: "Determination of total phosphorus – Colorimetry method", loq: "0,04% P₂O₅", method: "TCVN 8940:2011" },
  { no: 18, matrix: "Đất", name: "Xác định hàm lượng phospho dễ tiêu", nameEn: "Determination of bio-available phosphorus", loq: "3,4 mg P₂O₅/100g", method: "TCVN 5256:2009" },
  { no: 19, matrix: "Đất", name: "Xác định hàm lượng Nitơ dễ tiêu", nameEn: "Method for the determination of bio-available nitrogen", loq: "0,17 mg/100g", method: "TCVN 5255:2009" },
  { no: 20, matrix: "Đất", name: "Xác định hàm lượng As trong dịch chiết đất bằng cường thủy – Phương pháp GF-AAS", nameEn: "Determination of arsenic in aqua regia soil extracts – GF-AAS method", loq: "0,4 mg/kg", method: "TCVN 8467:2010" },
  { no: 21, matrix: "Đất", name: "Xác định pH (pH H₂O và pH KCl)", nameEn: "Determination of pH (pH H₂O, pH KCl)", loq: "2,0 ~ 10,0", method: "TCVN 5979:2021" },
  { no: 22, matrix: "Đất", name: "Xác định hàm lượng Hg trong dịch chiết đất bằng cường thủy – Phương pháp CV-AAS", nameEn: "Determination of mercury in aqua regia soil extracts – Cold-vapour atomic spectrometry method", loq: "0,5 mg/kg", method: "TCVN 8882:2011" },
  { no: 23, matrix: "Đất", name: "Xác định các cation bazơ trao đổi – Phương pháp dùng amoni axetat", nameEn: "Determination of base cation exchange by ammonium acetate method", loq: "K: 0,1 · Na: 0,5 · Ca: 1,0 · Mg: 1,0 meq/100g", method: "TCVN 8569:2010" },
  { no: 24, matrix: "Đất", name: `Xác định dư lượng thuốc bảo vệ thực vật nhóm phospho hữu cơ: ${OP_PESTICIDES} – Phương pháp GC-MS`, nameEn: `Determination of residue content of organophosphate pesticides: ${OP_PESTICIDES} – GC-MS method`, loq: "0,02 mg/kg mỗi chất", method: "AEMD-HD.M.SOP.GC/MS-02A:2025 (Ref: EN 15662:2018)" },

  // ── Nước mặt, nước ngầm / Surface water, ground water ──
  { no: 25, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Pb – Phương pháp GF-AAS", nameEn: "Determination of Pb content – GF-AAS method", loq: "4,0 μg/L", method: "TCVN 13091:2020" },
  { no: 26, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Cadimi – Phương pháp GF-AAS", nameEn: "Determination of cadmium content – GF-AAS method", loq: "0,5 μg/L", method: "TCVN 6197:2008" },
  { no: 27, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng As – Phương pháp GF-AAS", nameEn: "Determination of arsenic content – GF-AAS method", loq: "1,0 μg/L", method: "SMEWW 3113B:2023" },
  { no: 28, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Hg – Phương pháp CV-AAS", nameEn: "Determination of mercury content – CV-AAS method", loq: "0,5 μg/L", method: "TCVN 7877:2008" },
  { no: 29, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Cu – Phương pháp F-AAS", nameEn: "Determination of copper content – F-AAS method", loq: "0,05 mg/L", method: "TCVN 6193:1996" },
  { no: 30, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Zn – Phương pháp F-AAS", nameEn: "Determination of zinc content – F-AAS method", loq: "0,05 mg/L", method: "TCVN 6193:1996" },
  { no: 31, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Cr – Phương pháp F-AAS", nameEn: "Determination of total chromium content – F-AAS method", loq: "0,05 mg/L", method: "TCVN 6222:2008" },
  { no: 32, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Mn – Phương pháp F-AAS", nameEn: "Determination of manganese content – F-AAS method", loq: "0,05 mg/L", method: "SMEWW 3111B:2023" },
  { no: 33, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Fe – Phương pháp F-AAS", nameEn: "Determination of iron content – F-AAS method", loq: "0,05 mg/L", method: "SMEWW 3111B:2023" },
  { no: 34, matrix: "Nước mặt, nước ngầm", name: "Xác định nhu cầu oxy sinh hóa sau 5 ngày (BOD₅) – Phương pháp dùng cho mẫu không pha loãng", nameEn: "Determination of biochemical oxygen demand after 5 days (BOD₅) – Method for undiluted samples", loq: "2 mg/L", method: "TCVN 6001-2:2008" },
  { no: 35, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Oxy hòa tan (DO) – Phương pháp đầu dò điện hóa", nameEn: "Determination of dissolved oxygen – Electrochemical probe method", loq: "0,1 mg/L", method: "TCVN 7325:2016" },
  { no: 36, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng tổng chất rắn hòa tan (TDS)", nameEn: "Determination of Total Dissolved Solid content", loq: "6,0 mg/L", method: "SMEWW 2540C:2023" },
  { no: 37, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng tổng chất rắn lơ lửng (TSS) bằng cách lọc qua cái lọc sợi thủy tinh", nameEn: "Determination of total suspended solids (TSS) by filtration through a glass fiber filter", loq: "5 mg/L", method: "SMEWW 2540D:2023" },
  { no: 38, matrix: "Nước mặt, nước ngầm", name: "Xác định độ kiềm phenolphtalein và độ kiềm tổng số", nameEn: "Determination of phenolphthalein alkalinity and total alkalinity", loq: "17,0 mg/L", method: "SMEWW 2320B:2023" },
  { no: 39, matrix: "Nước mặt, nước ngầm", name: "Xác định độ dẫn điện (EC)", nameEn: "Determination of electrical conductivity (EC)", loq: "1,36 mS/m", method: "TCVN 13086:2020" },
  { no: 40, matrix: "Nước mặt, nước ngầm", name: "Xác định pH", nameEn: "Determination of pH", loq: "2 ~ 12", method: "TCVN 6492:2011" },
  { no: 41, matrix: "Nước mặt, nước ngầm", name: "Xác định hàm lượng Sunfat – Phương pháp trọng lượng sử dụng Bari clorua", nameEn: "Determination of sulfate – Gravimetric method using barium chloride", loq: "12,4 mg/L", method: "TCVN 6200:1996" },

  // ── Phân bón / Fertilizer ───────────────────────────────
  { no: 42, matrix: "Phân bón", name: "Xác định pH", nameEn: "Determination of pH", loq: "2 ~ 12", method: "TCVN 13263-9:2020" },
  { no: 43, matrix: "Phân bón", name: "Xác định hàm lượng nitơ hữu hiệu", nameEn: "Method for determination of available nitrogen", loq: "", method: "TCVN 9295:2012" },
  { no: 44, matrix: "Phân bón", name: "Xác định acid Humic và acid fulvic", nameEn: "Method for determination of humic acid and fulvic acid", loq: "", method: "TCVN 8561:2010" },
  { no: 45, matrix: "Phân bón", name: "Xác định độ ẩm", nameEn: "Method for determination of moisture", loq: "", method: "TCVN 9297:2012" },
  { no: 46, matrix: "Phân bón", name: "Xác định hàm lượng cacbon hữu cơ tổng số – Phương pháp Walkley Black", nameEn: "Determination of total organic carbon by Walkley–Black method", loq: "0,22%", method: "TCVN 9294:2012" },
  { no: 47, matrix: "Phân bón", name: "Xác định hàm lượng Nitơ tổng số – Phương pháp Kjeldahl", nameEn: "Method for determination of total nitrogen", loq: "0,052%", method: "TCVN 8557:2010" },
  { no: 48, matrix: "Phân bón", name: "Xác định hàm lượng Phospho hữu hiệu", nameEn: "Method for determination of available phosphorus", loq: "0,13%", method: "TCVN 8559:2010" },
  { no: 49, matrix: "Phân bón", name: "Xác định hàm lượng Phospho tổng số", nameEn: "Method for determination of total phosphorus", loq: "5,08%", method: "TCVN 8563:2010" },
  { no: 50, matrix: "Phân bón", name: "Xác định hàm lượng Kali hữu hiệu", nameEn: "Method for determination of available potassium", loq: "0,1%", method: "TCVN 8560:2018" },
  { no: 51, matrix: "Phân bón", name: "Xác định hàm lượng Pb tổng số – Phương pháp GF-AAS", nameEn: "Determination of total lead content – GF-AAS method", loq: "0,5 mg/kg", method: "TCVN 9290:2018" },
  // Tài liệu gốc in "TCVN 9291:20158" – giữ nguyên, cần xác nhận năm ban hành.
  { no: 52, matrix: "Phân bón", name: "Xác định hàm lượng Cd tổng số – Phương pháp GF-AAS", nameEn: "Determination of total cadmium – GF-AAS method", loq: "0,03 mg/kg", method: "TCVN 9291:20158" },
  { no: 53, matrix: "Phân bón", name: "Xác định hàm lượng As tổng số – Phương pháp GF-AAS", nameEn: "Determination of arsenic – GF-AAS method", loq: "0,5 mg/kg", method: "TCVN 11403:2016" },
  { no: 54, matrix: "Phân bón", name: "Xác định hàm lượng Cu tổng số – Phương pháp F-AAS", nameEn: "Determination of total copper – F-AAS method", loq: "3,0 mg/kg", method: "TCVN 9286:2018" },
  { no: 55, matrix: "Phân bón", name: "Xác định hàm lượng Zn tổng số – Phương pháp F-AAS", nameEn: "Method for determination of total zinc – F-AAS method", loq: "4,0 mg/kg", method: "TCVN 9289:2012" },
  { no: 56, matrix: "Phân bón", name: "Xác định hàm lượng Mn tổng số – Phương pháp F-AAS", nameEn: "Method for determination of total manganese – F-AAS method", loq: "6,0 mg/kg", method: "TCVN 9288:2012" },
  { no: 57, matrix: "Phân bón", name: "Xác định hàm lượng Fe tổng số – Phương pháp F-AAS", nameEn: "Determination of total iron – F-AAS method", loq: "6,0 mg/kg", method: "TCVN 9283:2012" },

  // ── Nước mặt / Surface water ────────────────────────────
  { no: 58, matrix: "Nước mặt", name: `Xác định dư lượng thuốc bảo vệ thực vật nhóm phospho hữu cơ: ${OP_PESTICIDES} – Phương pháp GC-MS`, nameEn: `Determination of residue content of organophosphate pesticides: ${OP_PESTICIDES} – GC-MS method`, loq: "0,02 μg/L mỗi chất", method: "AEMD-HD.M.SOP.GC/MS-02B:2025 (Ref: EPA SW-846 Method 3510 + Method 3520)" },

  // ── Rau, quả / Vegetables, fruits ───────────────────────
  { no: 59, matrix: "Rau, quả", name: `Xác định dư lượng thuốc bảo vệ thực vật nhóm phospho hữu cơ: ${OP_PESTICIDES} – Phương pháp GC-MS`, nameEn: `Determination of residue content of organophosphate pesticides: ${OP_PESTICIDES} – GC-MS method`, loq: "Mẫu tươi: 0,01 mg/kg · Mẫu khô: 0,02 mg/kg (mỗi chất)", method: "AEMD-HD.M.SOP.GC/MS-02C:2025 (Ref: TCVN 12848:2020 + SANTE/11813/2017 + EN 15662:2018)" },
];

export const accreditationNotes = [
  "TCVN: Tiêu chuẩn Việt Nam",
  "ISO: International Organization for Standardization",
  "AEMD-HD…: Phương pháp do Phòng thí nghiệm xây dựng",
  "Trường hợp Viện Nông nghiệp Thanh Hóa cung cấp dịch vụ thử nghiệm chất lượng sản phẩm, hàng hoá thì phải đăng ký hoạt động và được cấp giấy chứng nhận đăng ký hoạt động theo quy định của pháp luật trước khi cung cấp dịch vụ này.",
];
