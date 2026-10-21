import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/m2/reports/print-button";
import { getCustomers } from "@/lib/modules/m4/data/customers";
import { getQuotation, linesOf } from "@/lib/modules/m4/data/quotation-flow";
import { fmtVND, lineAmount, quotationTotal, vndInWords } from "@/lib/modules/m4/finance";
import { labInfo } from "@/lib/modules/m2/accreditation";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "In báo giá" };

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await getQuotation(id);
  if (!q) notFound();
  const [lines, customers] = await Promise.all([linesOf(id), getCustomers()]);
  const c = customers.find((x) => x.id === q.customerId);
  const total = quotationTotal(q.amount, q.vatRate);
  const date = q.issuedAt || todayISO();
  const [y, m, d] = date.split("-");
  const draft = !["Đã duyệt", "Đã gửi", "Được chấp nhận"].includes(q.status);

  return (
    <div className="py-6 print:py-0">
      <style>{`@page { size: A4; margin: 15mm; }`}</style>
      <div className="max-w-[210mm] mx-auto mb-4 px-4 flex items-center justify-between print:hidden">
        <Link href={`/quotations/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Báo giá {q.code}
        </Link>
        <PrintButton />
      </div>
      <article className="relative max-w-[210mm] mx-auto bg-white text-black p-[15mm] print:p-0 shadow print:shadow-none text-[11pt] leading-relaxed">
        {draft && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[64pt] font-bold text-rose-500/15 -rotate-30 select-none">
            BẢN NHÁP
          </div>
        )}
        <header className="flex items-start gap-4 border-b border-black pb-3">
          <Image src="/logo-vnnth.png" alt="" width={64} height={64} className="w-16 h-16 object-contain" />
          <div className="text-[10pt] leading-snug">
            <div className="font-bold text-[12pt] uppercase">Viện Nông nghiệp tỉnh Thanh Hóa</div>
            <div>{labInfo.address}</div>
            <div>Điện thoại: {labInfo.phone} · Email: {labInfo.email}</div>
          </div>
        </header>
        <div className="flex justify-between text-[10pt] mt-2">
          <span>Số: <b>{q.code}</b></span>
          <i>Thanh Hóa, ngày {d} tháng {m} năm {y}</i>
        </div>
        <h1 className="text-center font-bold text-[15pt] mt-5">BÁO GIÁ DỊCH VỤ</h1>
        <p className="text-center italic">{q.title}</p>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 text-[10.5pt]">
          <dt>Kính gửi:</dt><dd className="font-semibold">{c?.name ?? "Quý khách hàng"}</dd>
          {c?.address && (<><dt>Địa chỉ:</dt><dd>{c.address}</dd></>)}
          {c?.phone && (<><dt>Điện thoại:</dt><dd>{c.phone}</dd></>)}
        </dl>
        <p className="mt-3">Viện Nông nghiệp tỉnh Thanh Hóa trân trọng gửi Quý khách báo giá dịch vụ như sau:</p>

        <table className="w-full mt-3 border-collapse text-[10pt]">
          <thead>
            <tr className="[&>th]:border [&>th]:border-black [&>th]:px-2 [&>th]:py-1 [&>th]:font-semibold">
              <th>TT</th><th>Nội dung</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>Giảm</th><th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id} className="[&>td]:border [&>td]:border-black [&>td]:px-2 [&>td]:py-1">
                <td className="text-center">{i + 1}</td>
                <td>{l.description}</td>
                <td className="text-center">{l.unit}</td>
                <td className="text-right">{l.quantity.toLocaleString("vi-VN")}</td>
                <td className="text-right whitespace-nowrap">{fmtVND(l.unitPrice)}</td>
                <td className="text-right">{l.discountPct ? `${l.discountPct}%` : ""}</td>
                <td className="text-right whitespace-nowrap">{fmtVND(lineAmount(l))}</td>
              </tr>
            ))}
            <tr className="[&>td]:border [&>td]:border-black [&>td]:px-2 [&>td]:py-1">
              <td colSpan={6} className="text-right">Cộng tiền dịch vụ</td><td className="text-right whitespace-nowrap">{fmtVND(q.amount)}</td>
            </tr>
            <tr className="[&>td]:border [&>td]:border-black [&>td]:px-2 [&>td]:py-1">
              <td colSpan={6} className="text-right">Thuế GTGT ({q.vatRate}%)</td><td className="text-right whitespace-nowrap">{fmtVND(total - q.amount)}</td>
            </tr>
            <tr className="[&>td]:border [&>td]:border-black [&>td]:px-2 [&>td]:py-1 font-bold">
              <td colSpan={6} className="text-right">Tổng cộng</td><td className="text-right whitespace-nowrap">{fmtVND(total)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 italic text-[10pt]">Bằng chữ: {vndInWords(total)}.</p>

        <div className="mt-4 text-[10pt] space-y-1">
          {q.validUntil && <p>– Báo giá có hiệu lực đến ngày {fmtDateVN(q.validUntil)}.</p>}
          {q.note && <p className="whitespace-pre-line">– {q.note}</p>}
        </div>

        <div className="mt-10 grid grid-cols-2 text-center text-[10.5pt]">
          <div>
            <div className="font-semibold">Người lập</div>
            <div className="h-20" />
            <div>{q.preparedBy}</div>
          </div>
          <div>
            <div className="font-semibold">Phê duyệt</div>
            <div className="h-20 flex items-center justify-center text-[9pt] italic">{q.approvedBy && `Đã duyệt trên hệ thống ${fmtDateVN(q.approvedAt)}`}</div>
            <div>{q.approvedBy}</div>
          </div>
        </div>
      </article>
    </div>
  );
}
