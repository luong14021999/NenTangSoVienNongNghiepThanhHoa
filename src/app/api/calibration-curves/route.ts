import { computeCurveFields, curveStore, type CalibrationCurve } from "@/lib/data/calc-methods";
import { createRoute, listRoute } from "@/lib/api/crud";

export const dynamic = "force-dynamic";

export const GET = listRoute(curveStore);

/** Hồi quy luôn tính ở server từ điểm chuẩn. */
export const POST = createRoute<CalibrationCurve>(
  curveStore,
  (b) => ({
    id: "",
    code: b.code ?? "",
    testLabel: b.testLabel ?? "",
    instrumentCode: b.instrumentCode ?? "",
    analyzedAt: b.analyzedAt ?? "",
    validUntil: b.validUntil ?? "",
    analyst: b.analyst ?? "",
    concUnit: b.concUnit ?? "",
    signalUnit: b.signalUnit ?? "",
    pointsText: b.pointsText ?? "",
    r2Min: Number(b.r2Min) > 0 ? Number(b.r2Min) : 0.995,
    note: b.note ?? "",
    ...computeCurveFields(b.pointsText ?? ""),
  }),
  (b) => (!b.code ? "Thiếu mã đường chuẩn" : !b.pointsText ? "Thiếu điểm chuẩn" : null),
);
