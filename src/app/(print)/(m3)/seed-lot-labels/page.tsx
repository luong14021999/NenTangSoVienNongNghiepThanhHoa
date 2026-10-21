import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/m2/reports/print-button";
import { seedLotStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { byId } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "In tem truy xuất lô giống" };

/** Tem QR 60 × 40 mm dán bao bì lô giống (M3.2.6): QR mở trang /trace công khai. */
export default async function SeedLotLabelsPage({ searchParams }: { searchParams: Promise<{ codes?: string; copies?: string }> }) {
  const { codes = "", copies = "1" } = await searchParams;
  const wanted = codes.split(",").map((c) => c.trim()).filter(Boolean);
  const [lots, varieties] = await Promise.all([seedLotStore.list(), varietyStore.list()]);
  const varietyById = byId(varieties);
  const chosen = wanted.map((c) => lots.find((l) => l.code === c)).filter((l): l is NonNullable<typeof l> => Boolean(l));
  const n = Math.min(50, Math.max(1, Number(copies) || 1));
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const labels = await Promise.all(chosen.map(async (l) => ({ l, qr: await QRCode.toString(`${origin}/trace/${encodeURIComponent(l.code)}`, { type: "svg", margin: 0, width: 80 }) })));

  return (
    <div className="py-6 print:py-0">
      <style>{`@page { size: A4; margin: 8mm; } .lbl { width: 60mm; height: 40mm; } .lbl svg { display: block; }`}</style>
      <div className="max-w-[210mm] mx-auto mb-4 px-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/seed-lots" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Lô giống</Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{chosen.length} lô × {n} tem</span>
          {[1, 10, 50].map((c) => (
            <Link key={c} href={`/seed-lot-labels?codes=${encodeURIComponent(codes)}&copies=${c}`} className={`h-8 px-2.5 inline-flex items-center rounded-md border text-xs ${n === c ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{c} tem</Link>
          ))}
          <PrintButton />
        </div>
      </div>
      {chosen.length === 0 && <div className="max-w-[210mm] mx-auto px-4 text-sm text-muted-foreground">Không có lô nào để in (chỉ in lô đạt / đã chứng nhận)</div>}
      <div className="max-w-[210mm] mx-auto bg-white flex flex-wrap gap-[2mm] p-[2mm] print:p-0">
        {labels.flatMap(({ l, qr }) =>
          Array.from({ length: n }, (_, i) => (
            <div key={`${l.id}-${i}`} className="lbl border border-dashed border-gray-300 print:border-gray-200 rounded-sm p-[2mm] flex gap-[2mm] text-black overflow-hidden">
              <div className="shrink-0 w-[22mm] h-[22mm] [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <div className="min-w-0 leading-tight text-[7pt]">
                <div className="font-bold text-[7.5pt]">VIỆN NÔNG NGHIỆP THANH HÓA</div>
                <div className="font-semibold text-[8pt] mt-[1mm]">{varietyById.get(l.varietyId)?.name ?? ""}</div>
                <div>Cấp: {l.level}</div>
                <div className="font-mono font-bold text-[8pt]">{l.code}</div>
                <div>SX: {fmtDateVN(l.producedAt) || "—"} · {l.quantity.toLocaleString("vi-VN")} {l.unit}</div>
                {l.certificateNo && <div>GCN: {l.certificateNo}</div>}
                {l.conformityNo && <div>HQ: {l.conformityNo}</div>}
                <div className="text-[6pt] mt-[0.5mm]">Quét QR để truy xuất nguồn gốc</div>
              </div>
            </div>
          )),
        )}
      </div>
    </div>
  );
}
