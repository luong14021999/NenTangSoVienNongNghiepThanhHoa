// Dự báo (M1.6): làm trơn hàm mũ Holt (xu hướng tuyến tính), chọn tham số theo sai số dự báo 1 bước,
// khoảng dự báo xấp xỉ ±1,96·RMSE·√h; dự báo ngày hết tồn kho hóa chất. Hàm thuần, kiểm thử được.

export type HoltFit = { alpha: number; beta: number; level: number; trend: number; rmse: number; fitted: number[] };

/** Holt với α, β cho trước. Khởi tạo: l₀ = y₀, b₀ = y₁ − y₀. fitted[t] = dự báo 1 bước cho y[t] (t ≥ 1). */
export function holt(y: number[], alpha: number, beta: number): HoltFit {
  if (y.length < 2) throw new Error("Cần ít nhất 2 điểm dữ liệu");
  let l = y[0];
  let b = y[1] - y[0];
  const fitted: number[] = [y[0]];
  let sse = 0;
  for (let t = 1; t < y.length; t++) {
    const f = l + b;
    fitted.push(f);
    sse += (y[t] - f) ** 2;
    const lPrev = l;
    l = alpha * y[t] + (1 - alpha) * (l + b);
    b = beta * (l - lPrev) + (1 - beta) * b;
  }
  return { alpha, beta, level: l, trend: b, rmse: Math.sqrt(sse / (y.length - 1)), fitted };
}

/** Tìm α, β trên lưới 0,05…0,95 (bước 0,05) cho RMSE nhỏ nhất. */
export function fitHolt(y: number[]): HoltFit {
  let best: HoltFit | null = null;
  for (let a = 1; a <= 19; a++) {
    for (let bb = 1; bb <= 19; bb++) {
      const f = holt(y, a / 20, bb / 20);
      if (!best || f.rmse < best.rmse - 1e-12) best = f;
    }
  }
  return best!;
}

export type ForecastPoint = { step: number; value: number; lower: number; upper: number };

/**
 * Dự báo h bước. Dưới 4 điểm → dùng trung bình (không đủ dữ liệu ước lượng xu hướng).
 * `nonNegative`: số đếm / doanh thu không âm.
 */
export function forecastSeries(y: number[], h: number, nonNegative = true) {
  const clamp = (v: number) => (nonNegative ? Math.max(0, v) : v);
  if (y.length < 4) {
    const mean = y.length ? y.reduce((s, v) => s + v, 0) / y.length : 0;
    const sd = y.length > 1 ? Math.sqrt(y.reduce((s, v) => s + (v - mean) ** 2, 0) / (y.length - 1)) : 0;
    return {
      method: "Trung bình (dữ liệu < 4 kỳ)",
      fit: null,
      points: Array.from({ length: h }, (_, i) => ({ step: i + 1, value: clamp(mean), lower: clamp(mean - 1.96 * sd), upper: mean + 1.96 * sd })),
    };
  }
  const fit = fitHolt(y);
  const points: ForecastPoint[] = Array.from({ length: h }, (_, i) => {
    const k = i + 1;
    const v = fit.level + k * fit.trend;
    const half = 1.96 * fit.rmse * Math.sqrt(k);
    return { step: k, value: clamp(v), lower: clamp(v - half), upper: nonNegative ? Math.max(0, v + half) : v + half };
  });
  return { method: `Holt (α = ${fit.alpha.toFixed(2)}, β = ${fit.beta.toFixed(2)})`, fit, points };
}

/**
 * Ngày còn lại trước khi hết hóa chất: tồn hiện tại ÷ lượng dùng trung bình/ngày trong `days` ngày gần nhất.
 * Không có tiêu thụ → Infinity.
 */
export function daysToStockout(stock: number, usages: { qty: number; usedAt: string }[], today: string, days = 90) {
  const from = Date.parse(today) - days * 86_400_000;
  const used = usages.filter((u) => u.usedAt && Date.parse(u.usedAt.slice(0, 10)) >= from).reduce((s, u) => s + (Number(u.qty) || 0), 0);
  const perDay = used / days;
  if (perDay <= 0) return { perDay: 0, days: Infinity };
  return { perDay, days: Math.max(0, stock) / perDay };
}
