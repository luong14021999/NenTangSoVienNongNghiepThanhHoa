// Kết nối hóa đơn điện tử (M4.2).
// Mỗi nhà cung cấp (VNPT, Viettel, MISA, BKAV…) có API và hợp đồng riêng, nên KHÔNG có chế độ mô phỏng:
// hóa đơn là chứng từ tài chính, số hóa đơn giả dễ gây nhầm lẫn. Khi chưa kết nối, cán bộ phát hành trên
// phần mềm hóa đơn hiện dùng rồi nhập số hóa đơn, ký hiệu, mã tra cứu vào hệ thống.
// Khi ký hợp đồng với nhà cung cấp: đặt EINVOICE_PROVIDER + thông tin truy cập, bổ sung bộ chuyển đổi tại đây.

export const EINVOICE_PROVIDERS = ["Nhập tay", "VNPT", "Viettel", "MISA", "BKAV", "Khác"] as const;

export function einvoiceConnection() {
  const provider = process.env.EINVOICE_PROVIDER ?? "";
  return provider
    ? { connected: false, provider, message: `Đã khai báo nhà cung cấp ${provider} nhưng chưa có bộ chuyển đổi API – vẫn nhập tay số hóa đơn.` }
    : { connected: false, provider: "", message: "Chưa kết nối nhà cung cấp hóa đơn điện tử – phát hành trên phần mềm hóa đơn hiện dùng, rồi nhập số hóa đơn, ký hiệu, mã tra cứu." };
}
