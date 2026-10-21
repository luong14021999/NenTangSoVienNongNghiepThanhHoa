// Màu badge trạng thái dùng chung cho các trang M3.

export const diseaseVariant: Record<string, "secondary" | "success" | "destructive"> = {
  "Chưa kiểm tra": "secondary",
  "Sạch bệnh": "success",
  "Nhiễm bệnh": "destructive",
};

export const mediaQcVariant: Record<string, "warning" | "success" | "destructive"> = {
  "Chờ kiểm tra": "warning",
  "Đạt": "success",
  "Không đạt": "destructive",
};
