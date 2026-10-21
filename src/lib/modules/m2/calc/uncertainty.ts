// Ước lượng độ không đảm bảo đo theo cách tiếp cận ngân sách (GUM / EURACHEM-CITAC), §7.6.
// Các thành phần biểu diễn dạng độ không đảm bảo chuẩn tương đối (%); kết hợp căn tổng bình phương.

export type BudgetComponent = {
  name: string;
  /** "A" thống kê, "B" từ giấy chứng nhận / dung sai… */
  type: "A" | "B";
  /** độ không đảm bảo chuẩn tương đối, % */
  relU: number;
  source?: string;
};

export type UncertaintyInput = {
  value: number; // x̄
  components: BudgetComponent[]; // thành phần cố định của phương pháp
  k: number; // hệ số phủ
  /** thêm thành phần độ lặp lại từ chính các phép lặp: u_r = RSD/√n */
  rsd?: number;
  n?: number;
  /** thêm thành phần nội suy đường chuẩn: s(x0)/x0 */
  curveSx0?: number;
  curveX0?: number;
};

export type UncertaintyResult = {
  rows: { name: string; type: string; relU: number; source: string }[];
  relUc: number; // %
  uc: number; // tuyệt đối
  U: number; // mở rộng, tuyệt đối
  relU: number; // mở rộng, %
  k: number;
};

const sig = (x: number, d = 3) => Number(x.toPrecision(d));

export function combineUncertainty(input: UncertaintyInput): UncertaintyResult {
  // Giữ giá trị đầy đủ để kết hợp; chỉ làm tròn khi trả về để hiển thị (không làm tròn trung gian).
  const exact = input.components
    .filter((c) => Number.isFinite(c.relU) && c.relU >= 0)
    .map((c) => ({ name: c.name, type: c.type, relU: c.relU, source: c.source ?? "" }));
  if (input.rsd !== undefined && input.n && input.n > 0 && Number.isFinite(input.rsd)) {
    exact.push({ name: `Độ lặp lại (n = ${input.n})`, type: "A", relU: input.rsd / Math.sqrt(input.n), source: "RSD các phép lặp / √n" });
  }
  if (input.curveSx0 !== undefined && input.curveX0 && Number.isFinite(input.curveSx0)) {
    exact.push({ name: "Nội suy đường chuẩn", type: "A", relU: (input.curveSx0 / Math.abs(input.curveX0)) * 100, source: "s(x0)/x0" });
  }
  const relUc = Math.sqrt(exact.reduce((s, r) => s + r.relU ** 2, 0));
  const rows = exact.map((r) => ({ ...r, relU: sig(r.relU, 4) }));
  const uc = (relUc / 100) * Math.abs(input.value);
  const U = input.k * uc;
  return { rows, relUc: sig(relUc, 4), uc: sig(uc), U: sig(U, 2), relU: sig(input.k * relUc, 3), k: input.k };
}
