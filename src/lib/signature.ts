// Chữ ký điện tử nội bộ (M2.6): mã băm SHA-256 của nội dung chuẩn hoá – phát hiện mọi chỉnh sửa sau khi ký.
import { createHash } from "crypto";
import { stable } from "@/lib/diff";

export type ESignature = {
  signer: string;
  email: string;
  roles: string[];
  meaning: string; // ý nghĩa chữ ký: "Phê duyệt kết quả", "Phát hành phiếu kết quả", "Thu hồi phiếu"
  signedAt: string; // ISO
  method: string;
  contentHash: string;
};

export const SIGN_METHOD = "Xác thực lại bằng mật khẩu ngay trước khi ký";

/** SHA-256 (hex) của JSON chuẩn hoá (khoá sắp xếp) – cùng nội dung luôn cho cùng mã băm. */
export function contentHash(content: unknown) {
  return createHash("sha256").update(JSON.stringify(stable(content))).digest("hex");
}

/** Phần nội dung phiếu được ký – dùng chung khi phát hành và khi xác minh. */
export function reportSignedContent(r: {
  code: string;
  sampleCode: string;
  revision: number;
  replacesCode: string;
  note: string;
  snapshot: unknown;
}) {
  return { code: r.code, sampleCode: r.sampleCode, revision: r.revision, replacesCode: r.replacesCode || "", note: r.note || "", snapshot: r.snapshot };
}

/** Phần nội dung kết quả được ký khi Trưởng phòng phê duyệt. */
export function resultSignedContent(r: {
  resultCode: string;
  sampleCode: string;
  criterion: string;
  method: string;
  unit: string;
  replicates: unknown;
  mean: number;
  sd: number;
  rsd: number;
  uncertainty: number;
  conclusion: string;
  decisionRuleType: string;
}) {
  const n = (v: number) => (Number.isFinite(v) ? v : null);
  return {
    resultCode: r.resultCode,
    sampleCode: r.sampleCode,
    criterion: r.criterion,
    method: r.method,
    unit: r.unit,
    replicates: r.replicates,
    mean: n(r.mean),
    sd: n(r.sd),
    rsd: n(r.rsd),
    uncertainty: n(r.uncertainty),
    conclusion: r.conclusion,
    decisionRuleType: r.decisionRuleType,
  };
}
