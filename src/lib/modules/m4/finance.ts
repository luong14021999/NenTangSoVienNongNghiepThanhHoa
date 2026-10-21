// Tính toán tài chính M4 (hàm thuần, kiểm thử được).

/** Tổng báo giá sau thuế, làm tròn đến đồng. */
export const quotationTotal = (amount: number, vatRate: number) =>
  Math.round((Number(amount) || 0) * (1 + (Number(vatRate) || 0) / 100));

/** Số đã thu và công nợ còn lại của từng hợp đồng. */
export function contractBalances(
  contracts: { id: string; value: number }[],
  payments: { contractId: string; amount: number }[],
) {
  const paid = new Map<string, number>();
  for (const p of payments) {
    if (!p.contractId) continue;
    paid.set(p.contractId, (paid.get(p.contractId) ?? 0) + (Number(p.amount) || 0));
  }
  return new Map(
    contracts.map((c) => {
      const got = paid.get(c.id) ?? 0;
      return [c.id, { paid: got, debt: Math.max(0, (Number(c.value) || 0) - got) }];
    }),
  );
}

export const fmtVND = (v: number) => `${Math.round(Number(v) || 0).toLocaleString("vi-VN")} đ`;
