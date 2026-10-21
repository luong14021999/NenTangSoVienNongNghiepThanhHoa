// Tính kết quả từ số đọc: (đường chuẩn) → công thức phương pháp → thống kê → độ không đảm bảo đo.
// Hàm thuần dùng chung cho xem trước ở trình duyệt và tính chính thức ở server (M2.4, M2.5, §7.5, §7.6).
import { evaluate } from "./expression";
import { concFromSignal, fitLinear, sx0, type CurvePoint } from "./regression";
import { combineUncertainty, type BudgetComponent, type UncertaintyResult } from "./uncertainty";
import type { CalcVariable } from "./text-formats";

export type ComputeInput = {
  readings: number[];
  template?: { code: string; formula: string; readingVar: string; variables: CalcVariable[]; useCurve: boolean; resultUnit: string };
  /** Giá trị các biến của công thức (V, m, f…) – thiếu thì dùng mặc định của biến. */
  varValues?: Record<string, number>;
  curve?: { code: string; points: CurvePoint[]; r2Min: number; validUntil: string; concUnit: string };
  budget?: { code: string; components: BudgetComponent[]; k: number; includeRepeatability: boolean; includeCurve: boolean };
  /** U nhập tay khi không dùng ngân sách. */
  manualU?: number;
};

export type CalcDetail = {
  readings: number[];
  concs?: number[];
  values: number[];
  template?: { code: string; formula: string; readingVar: string; variables: Record<string, number>; resultUnit: string };
  curve?: { code: string; slope: number; intercept: number; r2: number; r2Min: number; minConc: number; maxConc: number; validUntil: string; concUnit: string; lod: number; loq: number };
};

export type ComputeOutput = {
  values: number[];
  mean: number;
  sd: number;
  rsd: number;
  U: number | undefined;
  calcDetail: CalcDetail;
  uncertaintyDetail?: UncertaintyResult & { budgetCode: string; note: string };
};

const sig = (x: number, d: number) => Number(x.toPrecision(d));

export function computeResult(input: ComputeInput): ComputeOutput {
  const readings = input.readings.filter((v) => Number.isFinite(v));
  if (!readings.length) throw new Error("Cần ít nhất 1 số đọc");
  const t = input.template;
  if (t?.useCurve && !input.curve) throw new Error(`Công thức ${t.code} cần chọn đường chuẩn`);

  // 1) Đường chuẩn: tín hiệu → nồng độ
  const fit = input.curve ? fitLinear(input.curve.points) : undefined;
  const useCurve = Boolean(fit && (t ? t.useCurve : true));
  const concs = useCurve ? readings.map((y) => concFromSignal(fit!, y)) : readings;

  // 2) Công thức phương pháp
  const varValues: Record<string, number> = {};
  if (t) {
    for (const v of t.variables) {
      const val = input.varValues?.[v.key] ?? v.default;
      if (val === undefined || !Number.isFinite(val)) throw new Error(`Thiếu giá trị "${v.label}" (${v.key})`);
      varValues[v.key] = val;
    }
  }
  const values = concs.map((c) => (t ? evaluate(t.formula, { ...varValues, [t.readingVar]: c }) : c));

  // 3) Thống kê
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  const rsd = mean !== 0 ? (sd / Math.abs(mean)) * 100 : 0;

  // 4) Độ không đảm bảo đo
  let U = input.manualU;
  let uncertaintyDetail: ComputeOutput["uncertaintyDetail"];
  if (input.budget) {
    const b = input.budget;
    const meanSignal = readings.reduce((a, c) => a + c, 0) / readings.length;
    const meanConc = concs.reduce((a, c) => a + c, 0) / concs.length;
    const res = combineUncertainty({
      value: mean,
      k: b.k,
      components: b.components,
      ...(b.includeRepeatability && n > 1 ? { rsd, n } : {}),
      ...(b.includeCurve && fit && useCurve ? { curveSx0: sx0(fit, meanSignal, readings.length), curveX0: meanConc } : {}),
    });
    U = res.U;
    uncertaintyDetail = {
      ...res,
      budgetCode: b.code,
      note: b.includeCurve && useCurve ? "Thành phần đường chuẩn tính tương đối theo nồng độ đọc, áp dụng cho công thức dạng nhân/chia" : "",
    };
  }

  return {
    values: values.map((v) => sig(v, 6)),
    mean: sig(mean, 4),
    sd: sig(sd, 3),
    rsd: Math.round(rsd * 100) / 100,
    U,
    uncertaintyDetail,
    calcDetail: {
      readings,
      ...(useCurve ? { concs: concs.map((c) => sig(c, 6)) } : {}),
      values: values.map((v) => sig(v, 6)),
      ...(t ? { template: { code: t.code, formula: t.formula, readingVar: t.readingVar, variables: varValues, resultUnit: t.resultUnit } } : {}),
      ...(fit && input.curve && useCurve
        ? {
            curve: {
              code: input.curve.code,
              slope: fit.slope,
              intercept: fit.intercept,
              r2: fit.r2,
              r2Min: input.curve.r2Min,
              minConc: fit.minConc,
              maxConc: fit.maxConc,
              validUntil: input.curve.validUntil,
              concUnit: input.curve.concUnit,
              lod: fit.lod,
              loq: fit.loq,
            },
          }
        : {}),
    },
  };
}
