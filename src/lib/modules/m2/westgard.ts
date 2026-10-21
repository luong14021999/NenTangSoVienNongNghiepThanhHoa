// Quy tắc Westgard cho biểu đồ kiểm soát Levey-Jennings (ISO/IEC 17025:2017 §7.7.1).
import type { QCPoint, WestgardRule } from "@/lib/mock-data";

/** Quy tắc "loại bỏ" – kết quả của loạt phân tích không được chấp nhận. */
export const REJECT_RULES: WestgardRule[] = ["1-3s", "2-2s"];

export type FlaggedPoint = QCPoint & {
  z: number;
  flags: WestgardRule[];
};

export function detectViolations(
  points: QCPoint[],
  mean: number,
  sd: number,
): FlaggedPoint[] {
  const zs = points.map((p) => (p.value - mean) / sd);
  return points.map((p, i) => {
    const z = zs[i];
    const flags: WestgardRule[] = [];
    if (Math.abs(z) > 3) flags.push("1-3s");
    if (i >= 1) {
      const z1 = zs[i - 1];
      if (
        Math.abs(z) > 2 &&
        Math.abs(z1) > 2 &&
        Math.sign(z) === Math.sign(z1)
      ) {
        flags.push("2-2s");
      }
    }
    if (i >= 1) {
      const z1 = zs[i - 1];
      if (Math.abs(z - z1) > 4) flags.push("R-4s");
    }
    if (i >= 3) {
      const last4 = zs.slice(i - 3, i + 1);
      if (last4.every((zi) => zi > 1) || last4.every((zi) => zi < -1)) {
        flags.push("4-1s");
      }
    }
    if (i >= 9) {
      const last10 = zs.slice(i - 9, i + 1);
      if (last10.every((zi) => zi > 0) || last10.every((zi) => zi < 0)) {
        flags.push("10x");
      }
    }
    return { ...p, z, flags };
  });
}

