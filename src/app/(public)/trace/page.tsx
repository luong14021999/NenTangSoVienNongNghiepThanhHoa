import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Truy xuất nguồn gốc lô giống – Viện Nông nghiệp tỉnh Thanh Hóa" };

export default async function TraceSearchPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const code = ((await searchParams).code ?? "").trim().slice(0, 64);
  if (code) redirect(`/trace/${encodeURIComponent(code)}`);
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><QrCode className="w-6 h-6 text-primary" />Truy xuất nguồn gốc lô giống</h1>
      <p className="text-sm text-muted-foreground">Quét mã QR trên tem cây giống, hoặc nhập mã lô in trên tem.</p>
      <form method="get" className="flex gap-2">
        <input name="code" required maxLength={64} placeholder="VD: LO-2026-001" className="flex-1 min-w-0 h-10 rounded-md border border-input bg-background px-3 text-sm font-mono" />
        <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Tra cứu</button>
      </form>
    </div>
  );
}
