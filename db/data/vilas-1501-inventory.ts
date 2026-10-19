// Danh mục thiết bị – dụng cụ – vật tư – hóa chất theo phạm vi VILAS 1501.
// Nguồn: "Danh_muc_VILAS_1501.pdf" (mục B, C, D và F – bổ sung phạm vi 2026).
// PDF không có số liệu tồn kho thực tế → số lượng = 0, vị trí "Chưa kiểm kê";
// phòng kiểm kê rồi cập nhật trực tiếp trên phần mềm.
import type { Chemical, Equipment, Supply, Tool, ToolCategory } from "../../src/lib/mock-data";

export const NOT_COUNTED = "Chưa kiểm kê";
const EXT_CAL = "Tổ chức hiệu chuẩn được công nhận";
const ADDED_2026 = "Bổ sung phạm vi 2026";

// ── B. Thiết bị chính + F. thiết bị bổ sung 2026 ────────────────────
type EquipmentSeed = Pick<Equipment, "name" | "purpose" | "quantity"> &
  Partial<Pick<Equipment, "calibrationFreq" | "calibrationPlace" | "inspectionFreq" | "inspectionPlace" | "model">>;

const equipmentSeeds: EquipmentSeed[] = [
  { name: "Máy quang phổ hấp thụ nguyên tử AAS (ngọn lửa F-AAS + lò graphit GF-AAS), bộ lấy mẫu tự động", purpose: "Cu, Zn, Cr (PP A); Cd, Pb (PP B) – TCVN 6496", quantity: "1 hệ", inspectionFreq: "Kiểm tra định kỳ độ nhạy, độ lặp lại", inspectionPlace: "Nội bộ PTN" },
  { name: "Đèn catot rỗng HCL (Cu, Zn, Cr, Cd, Pb), ống graphit, máy nén khí", purpose: "AAS", quantity: "1 bộ/nguyên tố" },
  { name: "Quang kế ngọn lửa (hoặc AAS chế độ phát xạ)", purpose: "K tổng, K dễ tiêu, Na/K muối hòa tan", quantity: "1" },
  { name: "Bộ phá mẫu Kjeldahl (block nhiệt) + máy chưng cất đạm + bộ hút/trung hòa khí axit", purpose: "N tổng (TCVN 6498), CEC", quantity: "1 hệ" },
  { name: "Bộ chiết cường thủy: bình cầu + sinh hàn hồi lưu (hoặc block có ống hồi lưu)", purpose: "Kim loại nặng", quantity: "1 bộ" },
  { name: "Máy đo pH (điện cực thủy tinh)", purpose: "pH (TCVN 5979)", quantity: "1", calibrationPlace: EXT_CAL },
  { name: "Máy đo độ dẫn điện (EC)", purpose: "EC (TCVN 6650), muối hòa tan", quantity: "1", calibrationPlace: EXT_CAL },
  { name: "Cân phân tích 0,0001 g", purpose: "Tất cả phép thử", quantity: "1", calibrationPlace: EXT_CAL, inspectionFreq: "Kiểm tra giữa kỳ bằng quả cân chuẩn E2/F1", inspectionPlace: "Nội bộ PTN" },
  { name: "Cân kỹ thuật 0,01 g", purpose: "Chuẩn bị mẫu, dung trọng", quantity: "1", calibrationPlace: EXT_CAL, inspectionFreq: "Kiểm tra giữa kỳ bằng quả cân chuẩn E2/F1", inspectionPlace: "Nội bộ PTN" },
  { name: "Tủ sấy 105 ± 5 °C", purpose: "Độ ẩm, dung trọng, muối hòa tan", quantity: "1–2", calibrationPlace: EXT_CAL, inspectionFreq: "Kiểm tra giữa kỳ bằng nhiệt kế chuẩn", inspectionPlace: "Nội bộ PTN" },
  { name: "Lò nung", purpose: "Nung chén, xử lý mẫu", quantity: "1", calibrationPlace: EXT_CAL },
  { name: "Máy lắc ngang/tròn", purpose: "Chiết K, CEC, pH, EC", quantity: "1" },
  { name: "Máy ly tâm", purpose: "Tách dịch chiết, CEC", quantity: "1" },
  { name: "Bếp điện, bếp cách thủy, bể ổn nhiệt", purpose: "Cô cạn, cấp hạt", quantity: "1 mỗi loại" },
  { name: "Bộ pipet Robinson, ống đong 1000 mL, máy khuấy, rây 2 mm và 0,05 mm", purpose: "Cấp hạt (TCVN 8567)", quantity: "1 bộ" },
  { name: "Ống trụ lấy mẫu nguyên khối (thể tích xác định), búa, dao gọt", purpose: "Dung trọng (TCVN 6860)", quantity: "1 bộ" },
  { name: "Máy nghiền đất, cối chày mã não/sứ, rây 2 mm và 0,25 mm (0,15 mm)", purpose: "Chuẩn bị mẫu", quantity: "1 bộ" },
  { name: "Hệ thống nước cất 2 lần / nước siêu sạch (loại 1–2, TCVN 4851)", purpose: "Tất cả, đặc biệt GF-AAS", quantity: "1" },
  { name: "Tủ hút khí độc chịu axit", purpose: "Phá mẫu, cường thủy, HClO₄/HF", quantity: "1–2" },
  { name: "Bình hút ẩm, tủ lạnh bảo quản chuẩn, điều hòa, nhiệt-ẩm kế phòng", purpose: "Điều kiện môi trường", quantity: "Theo nhu cầu", calibrationPlace: `Nhiệt kế: ${EXT_CAL}` },
  // F. Bổ sung theo phạm vi mở rộng 2026
  { name: "Máy quang phổ UV-Vis", purpose: "P tổng, P dễ tiêu (đất); P hữu hiệu, P tổng (phân bón)", quantity: "", model: ADDED_2026 },
  { name: "Bộ hóa hơi lạnh CV-AAS + đèn HCL Hg", purpose: "Hg (đất, nước)", quantity: "", model: ADDED_2026 },
  { name: "Đèn HCL As, Mn, Fe", purpose: "As (GF-AAS); Mn, Fe (F-AAS)", quantity: "", model: ADDED_2026 },
  { name: "Máy sắc ký khí khối phổ GC-MS", purpose: "Dư lượng thuốc BVTV nhóm phospho hữu cơ (đất, nước mặt, rau quả)", quantity: "", model: ADDED_2026 },
  { name: "Máy đo DO (điện cực)", purpose: "DO (nước)", quantity: "", model: ADDED_2026 },
  { name: "Tủ ấm BOD 20 °C", purpose: "BOD₅ (nước)", quantity: "", model: ADDED_2026 },
  { name: "Bộ lọc chân không", purpose: "TSS, TDS (nước)", quantity: "", model: ADDED_2026 },
];

export const equipmentRows: Omit<Equipment, "id">[] = equipmentSeeds.map((e, i) => ({
  code: `TB-${String(i + 1).padStart(3, "0")}`,
  name: e.name,
  model: e.model ?? "",
  location: NOT_COUNTED,
  lastCalibration: "",
  nextCalibration: "",
  status: "Hoạt động",
  usageHours: 0,
  serial: "",
  manufacturer: "",
  commissionedAt: "",
  calibrationFreq: e.calibrationFreq ?? "",
  calibrationPlace: e.calibrationPlace ?? "",
  inspectionFreq: e.inspectionFreq ?? "",
  inspectionPlace: e.inspectionPlace ?? "",
  purpose: e.purpose,
  quantity: e.quantity,
}));

// ── C1–C7. Dụng cụ (+ F: chai BOD, chén cô cạn) ─────────────────────
type ToolSeed = { name: string; category: ToolCategory; spec: string; unit: string; cal?: boolean };

const toolSeeds: ToolSeed[] = [
  { name: "Bình định mức cấp A", category: "Dụng cụ thể tích", spec: "25, 50, 100, 250, 500, 1000 mL; đã hiệu chuẩn · Dùng cho: pha chuẩn, định mức dịch chiết", unit: "cái", cal: true },
  { name: "Pipet bầu cấp A", category: "Dụng cụ thể tích", spec: "1, 2, 5, 10, 25, 50 mL · Dùng cho: lấy mẫu dung dịch", unit: "cái", cal: true },
  { name: "Buret cấp A", category: "Dụng cụ thể tích", spec: "10, 25, 50 mL · Dùng cho: chuẩn độ (Walkley-Black, Kjeldahl, ion)", unit: "cái", cal: true },
  { name: "Micropipet và đầu tip", category: "Dụng cụ thể tích", spec: "100 µL, 1 mL, 5 mL · Dùng cho: pha chuẩn AAS", unit: "cái", cal: true },
  { name: "Ống đong, bình tam giác 250–500 mL, cốc có mỏ, phễu", category: "Dụng cụ thủy tinh", spec: "Dùng cho: thao tác chung", unit: "bộ" },
  { name: "Chén cân, hộp nhôm, chén sứ, bát sứ", category: "Dụng cụ cầm tay", spec: "Dùng cho: độ ẩm, muối hòa tan", unit: "bộ" },
  { name: "Chén platin hoặc PTFE", category: "Dụng cụ cầm tay", spec: "Dùng cho: phá mẫu K tổng bằng HF", unit: "cái" },
  { name: "Chai BOD", category: "Dụng cụ thủy tinh", spec: `Dùng cho: BOD₅ (nước) · ${ADDED_2026}`, unit: "cái" },
  { name: "Chén cô cạn", category: "Dụng cụ cầm tay", spec: `Dùng cho: TDS (nước) · ${ADDED_2026}`, unit: "cái" },
];

export const toolRows: Omit<Tool, "id">[] = toolSeeds.map((t, i) => ({
  code: `DC-${String(i + 1).padStart(3, "0")}`,
  name: t.name,
  category: t.category,
  spec: t.spec,
  qty: 0,
  unit: t.unit,
  minQty: 0,
  location: NOT_COUNTED,
  calibrationRequired: Boolean(t.cal),
  lastCalibration: "",
  nextCalibration: "",
  status: "Sẵn sàng",
}));

// ── C8–C14. Vật tư tiêu hao (+ F: giấy lọc sợi thủy tinh) ───────────
const supplySeeds: { name: string; unit: string; purpose: string }[] = [
  { name: "Giấy lọc định lượng (Whatman 40, 42 hoặc tương đương), băng xanh/đỏ", unit: "hộp", purpose: "Lọc dịch chiết" },
  { name: "Chai nhựa PE/PP sạch axit, ống ly tâm 50 mL", unit: "cái", purpose: "Lưu mẫu, dịch chiết kim loại" },
  { name: "Túi đựng mẫu, nhãn, bút dầu", unit: "gói", purpose: "Quản lý mẫu" },
  { name: "Găng tay nitrile, khẩu trang chống hơi axit, kính bảo hộ, áo blouse", unit: "bộ", purpose: "Bảo hộ lao động" },
  { name: "Khí acetylene (C₂H₂)", unit: "bình", purpose: "F-AAS" },
  { name: "Khí argon tinh khiết ≥ 99,999 %", unit: "bình", purpose: "GF-AAS" },
  { name: "Khí N₂O", unit: "bình", purpose: "Đo Cr bằng ngọn lửa N₂O-C₂H₂ (nếu áp dụng)" },
  { name: "Giấy lọc sợi thủy tinh", unit: "hộp", purpose: `TSS, TDS (nước) – ${ADDED_2026}` },
];

export const supplyRows: Omit<Supply, "id">[] = supplySeeds.map((s, i) => ({
  code: `VT-${String(i + 1).padStart(3, "0")}`,
  name: s.name,
  unit: s.unit,
  qty: 0,
  minQty: 0,
  location: NOT_COUNTED,
  note: `Dùng cho: ${s.purpose} · Cần kiểm kê`,
}));

// ── D. Hóa chất (+ F: hóa chất bổ sung 2026) ────────────────────────
type ChemSeed = {
  name: string;
  usedFor: string[];
  hazard?: Chemical["hazard"];
  unit?: string;
  ref?: boolean;
  spec?: string;
  storage?: string;
};

const PA = "Tinh khiết phân tích (PA) trở lên, có CoA";
const ACID_CABINET = "Tủ đựng axit riêng";
const SOLVENT_CABINET = "Tủ đựng dung môi riêng";
const FRIDGE = "Tủ lạnh bảo quản chuẩn";

const OC = "Cacbon hữu cơ (TCVN 8941)";
const P_TESTS = "P tổng, P dễ tiêu (đất); P hữu hiệu, P tổng (phân bón)";
const OP_RESIDUE = "Dư lượng thuốc BVTV nhóm phospho hữu cơ (đất, nước mặt, rau quả)";

const standard = (el: string, usedFor: string): ChemSeed => ({
  name: `Dung dịch chuẩn ${el} 1000 mg/L (CRM, có truy xuất)`,
  usedFor: [usedFor],
  unit: "lọ",
  ref: true,
  spec: "Chất chuẩn được chứng nhận, có truy xuất nguồn gốc",
  storage: FRIDGE,
});

const chemicalSeeds: ChemSeed[] = [
  { name: "Kali dicromat K₂Cr₂O₇", usedFor: [OC], hazard: "Độc hại" },
  { name: "Axit sulfuric H₂SO₄ đặc 96–98 %", usedFor: ["Cacbon hữu cơ", "Kjeldahl", "Phá mẫu"], hazard: "Ăn mòn", storage: ACID_CABINET },
  { name: "Muối Mohr (NH₄)₂Fe(SO₄)₂·6H₂O hoặc FeSO₄·7H₂O", usedFor: ["Cacbon hữu cơ"] },
  { name: "Chỉ thị diphenylamine hoặc ferroin (o-phenanthroline)", usedFor: ["Cacbon hữu cơ"], hazard: "Độc hại", unit: "lọ" },
  { name: "Axit phosphoric H₃PO₄ 85 %", usedFor: ["Cacbon hữu cơ"], hazard: "Ăn mòn", storage: ACID_CABINET },
  { name: "Dung dịch đệm chuẩn pH 4,01 – 7,00 – 10,01", usedFor: ["Hiệu chuẩn máy pH"], ref: true },
  { name: "Kali clorua KCl", usedFor: ["pH (KCl 1M)", "EC (KCl 0,01M chuẩn 1413 µS/cm)", "CEC (KCl 10 % đẩy NH₄⁺)"] },
  { name: "Canxi clorua CaCl₂ 0,01M", usedFor: ["pH (tùy chọn)"] },
  { name: "Axit clohydric HCl 37 % loại phân tích vết", usedFor: ["Cường thủy", "Sulfate", "Cấp hạt"], hazard: "Ăn mòn", spec: "Loại phân tích vết, có CoA", storage: ACID_CABINET },
  { name: "Axit nitric HNO₃ 65 % loại phân tích vết (Suprapur hoặc tương đương)", usedFor: ["Cường thủy (TCVN 6496)"], hazard: "Ăn mòn", spec: "Loại phân tích vết (Suprapur hoặc tương đương), có CoA", storage: ACID_CABINET },
  { name: "Bari clorua BaCl₂·2H₂O", usedFor: ["Sulfate, ion SO₄²⁻"], hazard: "Độc hại" },
  { name: "Bạc nitrat AgNO₃", usedFor: ["Ion Cl⁻, thử rửa kết tủa"], hazard: "Ăn mòn" },
  { name: "Kali cromat K₂CrO₄", usedFor: ["Ion Cl⁻, thử rửa kết tủa"], hazard: "Độc hại" },
  { name: "Kali sulfat K₂SO₄ (xúc tác)", usedFor: ["Kjeldahl"] },
  { name: "Đồng sulfat CuSO₄·5H₂O (xúc tác)", usedFor: ["Kjeldahl"], hazard: "Độc hại" },
  { name: "Axit salicylic", usedFor: ["Kjeldahl cải biên (thu cả nitrat)"] },
  { name: "Natri thiosulfat Na₂S₂O₃", usedFor: ["Kjeldahl cải biên (thu cả nitrat)"] },
  { name: "Natri hydroxit NaOH", usedFor: ["Chưng cất đạm (dung dịch 10M)", "Axit humic/fulvic (phân bón)"], hazard: "Ăn mòn" },
  { name: "Axit boric H₃BO₃ 2 %", usedFor: ["Hấp thụ NH₃"] },
  { name: "Chỉ thị hỗn hợp bromocresol xanh + metyl đỏ", usedFor: ["Kjeldahl", "CEC"], unit: "lọ" },
  { name: "H₂SO₄ hoặc HCl chuẩn 0,01M (ống chuẩn)", usedFor: ["Chuẩn độ đạm"], unit: "ống", ref: true },
  { name: "Axit flohydric HF", usedFor: ["Phá mẫu K tổng (TCVN 8660)"], hazard: "Độc hại", storage: ACID_CABINET },
  { name: "Axit pecloric HClO₄", usedFor: ["Phá mẫu K tổng (TCVN 8660)"], hazard: "Ăn mòn", storage: ACID_CABINET },
  { name: "Dung dịch chiết K dễ tiêu (NH₄OAc 1M pH 7 hoặc HCl 0,2N)", usedFor: ["K dễ tiêu (TCVN 8662)"] },
  { name: "Hydro peroxit H₂O₂ 30 %", usedFor: ["Cấp hạt (khử chất hữu cơ)"], hazard: "Ăn mòn" },
  { name: "Natri hexametaphosphat (NaPO₃)₆", usedFor: ["Cấp hạt (chất phân tán)"] },
  { name: "Natri cacbonat Na₂CO₃", usedFor: ["Cấp hạt (chất phân tán)"] },
  { name: "Amoni axetat CH₃COONH₄", usedFor: ["CEC (TCVN 8568)"] },
  { name: "Axit axetic CH₃COOH", usedFor: ["CEC (TCVN 8568)"], hazard: "Ăn mòn", storage: ACID_CABINET },
  { name: "Amoni hydroxit NH₄OH", usedFor: ["CEC (TCVN 8568)"], hazard: "Ăn mòn" },
  { name: "Ethanol 80–96 %", usedFor: ["CEC (rửa NH₄⁺ dư)"], hazard: "Dễ cháy", storage: SOLVENT_CABINET },
  { name: "Natri clorua NaCl", usedFor: ["CEC", "Chuẩn Na"] },
  standard("Cu", "AAS"),
  standard("Zn", "AAS"),
  standard("Cr", "AAS"),
  standard("Cd", "AAS"),
  standard("Pb", "AAS"),
  standard("K", "Quang kế ngọn lửa"),
  standard("Na", "Quang kế ngọn lửa"),
  { name: "Chất cải biến nền NH₄H₂PO₄", usedFor: ["GF-AAS (Cd, Pb)"] },
  { name: "Chất cải biến nền Mg(NO₃)₂", usedFor: ["GF-AAS (Cd, Pb)"] },
  { name: "Chất cải biến nền Pd(NO₃)₂", usedFor: ["GF-AAS (Cd, Pb)"], hazard: "Ăn mòn", unit: "lọ" },
  { name: "Muối La hoặc chất triệt tiêu cản trở (theo SOP)", usedFor: ["F-AAS (Cr)"] },
  { name: "EDTA", usedFor: ["Ca²⁺, Mg²⁺ trong muối hòa tan"] },
  { name: "Đệm NH₄Cl/NH₄OH", usedFor: ["Ca²⁺, Mg²⁺ trong muối hòa tan"], hazard: "Ăn mòn" },
  { name: "Chỉ thị eriochrome đen T", usedFor: ["Ca²⁺, Mg²⁺ trong muối hòa tan"], unit: "lọ" },
  { name: "Chỉ thị murexide", usedFor: ["Ca²⁺, Mg²⁺ trong muối hòa tan"], unit: "lọ" },
  { name: "Chỉ thị phenolphtalein", usedFor: ["CO₃²⁻, HCO₃⁻ trong muối hòa tan"], hazard: "Độc hại", unit: "lọ" },
  { name: "Chỉ thị methyl da cam", usedFor: ["CO₃²⁻, HCO₃⁻ trong muối hòa tan"], hazard: "Độc hại", unit: "lọ" },
  // F. Bổ sung theo phạm vi mở rộng 2026
  { name: "Amoni molypdat", usedFor: [P_TESTS] },
  { name: "Axit ascorbic", usedFor: [P_TESTS] },
  { name: "Kali antimonyl tartrat", usedFor: [P_TESTS], hazard: "Độc hại" },
  { name: "Thiếc(II) clorua SnCl₂ hoặc natri borohydrid NaBH₄", usedFor: ["Hg (đất, nước) – CV-AAS"], hazard: "Ăn mòn" },
  { name: "Kali permanganat KMnO₄", usedFor: ["Hg (đất, nước) – CV-AAS"], hazard: "Độc hại" },
  standard("As", "As (GF-AAS)"),
  standard("Hg", "Hg (CV-AAS)"),
  standard("Mn", "Mn (F-AAS)"),
  standard("Fe", "Fe (F-AAS)"),
  { name: "Bộ muối QuEChERS (MgSO₄, NaCl, muối citrat, PSA, C18)", usedFor: [OP_RESIDUE], unit: "bộ" },
  { name: "Acetonitril loại phân tích dư lượng", usedFor: [OP_RESIDUE], hazard: "Dễ cháy", spec: "Loại phân tích dư lượng, có CoA", storage: SOLVENT_CABINET },
  { name: "n-Hexan loại phân tích dư lượng", usedFor: [OP_RESIDUE], hazard: "Dễ cháy", spec: "Loại phân tích dư lượng, có CoA", storage: SOLVENT_CABINET },
  { name: "Dichloromethan loại phân tích dư lượng", usedFor: [OP_RESIDUE], hazard: "Độc hại", spec: "Loại phân tích dư lượng, có CoA", storage: SOLVENT_CABINET },
  { name: "Chuẩn 12 hoạt chất thuốc BVTV nhóm phospho hữu cơ", usedFor: [OP_RESIDUE], hazard: "Độc hại", unit: "lọ", ref: true, spec: "Chất chuẩn có chứng nhận", storage: FRIDGE },
  { name: "Chất chuẩn nội (GC-MS)", usedFor: [OP_RESIDUE], unit: "lọ", ref: true, spec: "Chất chuẩn có chứng nhận", storage: FRIDGE },
  { name: "Natri pyrophosphat Na₄P₂O₇", usedFor: ["Axit humic/fulvic (phân bón)"] },
  { name: "Dung dịch chiết theo các TCVN phân bón tương ứng", usedFor: ["Axit humic/fulvic, P/K hữu hiệu (phân bón)"] },
];

export const chemicalRows: Omit<Chemical, "id">[] = chemicalSeeds.map((c, i) => ({
  code: `HC-${String(i + 1).padStart(3, "0")}`,
  name: c.name,
  cas: "",
  unit: c.unit ?? "chai",
  stock: 0,
  minStock: 0,
  expiry: "",
  hazard: c.hazard ?? "Thường",
  location: NOT_COUNTED,
  technicalSpec: c.spec ?? PA,
  manufacturer: "",
  manufactureDate: "",
  receivedAt: "",
  storageCondition: c.storage ?? "",
  usedFor: c.usedFor,
  isReference: Boolean(c.ref),
}));
