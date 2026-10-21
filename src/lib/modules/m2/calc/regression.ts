// Đường chuẩn tuyến tính y = a + b·x bằng bình phương tối thiểu (M2.5).
// LOD = 3,3·s(y/x)/b · LOQ = 10·s(y/x)/b (ICH Q2) · s(x0) theo Miller & Miller.

export type CurvePoint = { conc: number; signal: number };

export type CurveFit = {
  n: number;
  slope: number; // b
  intercept: number; // a
  r: number;
  r2: number;
  syx: number; // độ lệch chuẩn phần dư s(y/x)
  lod: number;
  loq: number;
  xMean: number;
  yMean: number;
  sxx: number;
  minConc: number;
  maxConc: number;
};

const sig = (x: number, d = 6) => Number(x.toPrecision(d));

export function fitLinear(points: CurvePoint[]): CurveFit {
  const pts = points.filter((p) => Number.isFinite(p.conc) && Number.isFinite(p.signal));
  const n = pts.length;
  if (n < 3) throw new Error("Đường chuẩn cần ít nhất 3 điểm");
  const xMean = pts.reduce((s, p) => s + p.conc, 0) / n;
  const yMean = pts.reduce((s, p) => s + p.signal, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.conc - xMean) ** 2, 0);
  const syy = pts.reduce((s, p) => s + (p.signal - yMean) ** 2, 0);
  const sxy = pts.reduce((s, p) => s + (p.conc - xMean) * (p.signal - yMean), 0);
  if (sxx === 0) throw new Error("Các điểm chuẩn phải có nồng độ khác nhau");
  const b = sxy / sxx;
  if (b === 0) throw new Error("Hệ số góc bằng 0 – tín hiệu không phụ thuộc nồng độ");
  const a = yMean - b * xMean;
  const ssRes = pts.reduce((s, p) => s + (p.signal - (a + b * p.conc)) ** 2, 0);
  const syx = Math.sqrt(ssRes / (n - 2));
  const r = syy === 0 ? 1 : sxy / Math.sqrt(sxx * syy);
  return {
    n,
    slope: sig(b),
    intercept: sig(a),
    r: sig(r, 8),
    r2: sig(r * r, 8),
    syx: sig(syx),
    lod: sig((3.3 * syx) / Math.abs(b), 4),
    loq: sig((10 * syx) / Math.abs(b), 4),
    xMean,
    yMean,
    sxx,
    minConc: Math.min(...pts.map((p) => p.conc)),
    maxConc: Math.max(...pts.map((p) => p.conc)),
  };
}

/** Nồng độ từ tín hiệu: x0 = (y0 − a) / b. */
export const concFromSignal = (fit: Pick<CurveFit, "slope" | "intercept">, signal: number) =>
  (signal - fit.intercept) / fit.slope;

/**
 * Độ lệch chuẩn của nồng độ nội suy từ m lần đo tín hiệu (Miller & Miller):
 * s(x0) = s(y/x)/|b| · √(1/m + 1/n + (ȳ0 − ȳ)² / (b²·Sxx))
 */
export function sx0(fit: CurveFit, y0Mean: number, m: number) {
  return (fit.syx / Math.abs(fit.slope)) * Math.sqrt(1 / m + 1 / fit.n + (y0Mean - fit.yMean) ** 2 / (fit.slope ** 2 * fit.sxx));
}
