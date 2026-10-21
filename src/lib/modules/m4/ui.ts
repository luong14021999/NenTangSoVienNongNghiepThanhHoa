// Màu badge trạng thái dùng chung cho các trang M4.
import type { QuotationStatus } from "@/lib/modules/m4/finance";

export const quotationStatusVariant: Record<QuotationStatus, "secondary" | "default" | "success" | "destructive" | "warning" | "outline"> = {
  "Nháp": "secondary",
  "Chờ duyệt": "warning",
  "Đã duyệt": "outline",
  "Đã gửi": "default",
  "Được chấp nhận": "success",
  "Từ chối": "destructive",
  "Hết hạn": "secondary",
};
