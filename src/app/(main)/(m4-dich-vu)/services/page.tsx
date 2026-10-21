import { redirect } from "next/navigation";

/** Trang dịch vụ (dữ liệu mẫu) đã thay bằng Bảng giá & định mức – dữ liệu thật trong m4.price_items. */
export default function ServicesPage() {
  redirect("/price-list");
}
