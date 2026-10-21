import Image from "next/image";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { getReportByCode, recomputeHash } from "@/lib/modules/m2/data/reports";
import { labInfo } from "@/lib/modules/m2/accreditation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Xác minh phiếu kết quả", robots: { index: false } };

/** "21/10/2026 08:11" theo giờ Việt Nam. */
function dt(iso: string) {
  if (!iso) return "—";
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
}

/** Che bớt tên khách hàng trên trang công khai: "Công ty CP Phân bón Tiến Nông" → "Công ty C… N…". */
const mask = (name: string) =>
  name
    .split(/\s+/)
    .map((w, i) => (i < 2 ? w : `${w[0]}…`))
    .join(" ");

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ h?: string }>;
}) {
  const { code } = await params;
  const { h = "" } = await searchParams;
  const report = await getReportByCode(decodeURIComponent(code));

  const intact = report ? Boolean(report.contentHash) && recomputeHash(report) === report.contentHash : false;
  const qrMatches = report && h ? report.contentHash.startsWith(h.toLowerCase()) : true;
  const valid = Boolean(report) && intact && qrMatches && report!.status === "Đã phát hành";

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Image src="/logo-vnnth.png" alt="" width={48} height={48} className="w-12 h-12 object-contain" />
        <div className="leading-tight">
          <div className="text-xs text-muted-foreground">{labInfo.organization}</div>
          <div className="font-semibold">{labInfo.accreditedName} · {labInfo.vilasCode}</div>
        </div>
      </div>

      <div className={`rounded-xl border-2 p-5 bg-card ${valid ? "border-emerald-500" : "border-rose-500"}`}>
        <div className="flex items-center gap-2 text-lg font-bold">
          {valid ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : report ? <ShieldAlert className="w-6 h-6 text-rose-600" /> : <XCircle className="w-6 h-6 text-rose-600" />}
          {!report
            ? "Không tìm thấy phiếu kết quả"
            : !intact || !qrMatches
              ? "Cảnh báo: nội dung không khớp chữ ký"
              : report.status === "Đã phát hành"
                ? "Phiếu kết quả hợp lệ"
                : `Phiếu ${report.status.toLowerCase()} – không còn hiệu lực`}
        </div>
        {report && (
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Số phiếu</dt>
            <dd className="font-mono font-semibold">{report.code}{report.revision > 0 && ` · sửa đổi lần ${report.revision}`}</dd>
            <dt className="text-muted-foreground">Mã mẫu</dt>
            <dd className="font-mono">{report.sampleCode}</dd>
            <dt className="text-muted-foreground">Khách hàng</dt>
            <dd>{mask(report.snapshot.customer.name)}</dd>
            <dt className="text-muted-foreground">Số chỉ tiêu</dt>
            <dd>{report.snapshot.lines.length}</dd>
            <dt className="text-muted-foreground">Phát hành</dt>
            <dd>{dt(report.issuedAt)}</dd>
            <dt className="text-muted-foreground">Ký điện tử</dt>
            <dd>{report.signature ? `${report.signature.signer} · ${dt(report.signature.signedAt)}` : "Phiếu phát hành trước khi áp dụng ký điện tử"}</dd>
            <dt className="text-muted-foreground">Trạng thái</dt>
            <dd className={report.status === "Đã phát hành" ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>{report.status}</dd>
            {report.status === "Đã thu hồi" && (
              <>
                <dt className="text-muted-foreground">Thu hồi</dt>
                <dd>{dt(report.revokedAt)} · {report.revokeReason}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Toàn vẹn</dt>
            <dd className={intact && qrMatches ? "text-emerald-700" : "text-rose-700 font-medium"}>
              {intact && qrMatches ? "Nội dung trùng khớp với lúc ký (SHA-256)" : "Nội dung đã thay đổi so với lúc ký – liên hệ phòng thí nghiệm"}
            </dd>
            <dt className="text-muted-foreground">SHA-256</dt>
            <dd className="font-mono text-[11px] break-all">{report.contentHash || "—"}</dd>
          </dl>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Trang này chỉ xác nhận tính xác thực và hiệu lực của phiếu; kết quả chi tiết xem trên bản phiếu gốc.
        Liên hệ: {labInfo.phone} · {labInfo.email}
      </p>
    </div>
  );
}
