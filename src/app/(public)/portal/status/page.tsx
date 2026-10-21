import { RequestStatusForm } from "@/components/m4/portal/status-form";

export const metadata = { title: "Tra cứu yêu cầu dịch vụ – Viện Nông nghiệp tỉnh Thanh Hóa", robots: { index: false } };

export default async function PortalStatusPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = "" } = await searchParams;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Tra cứu tình trạng yêu cầu</h1>
        <p className="text-sm text-muted-foreground mt-1">Nhập mã yêu cầu và số điện thoại đã dùng khi gửi.</p>
      </div>
      <RequestStatusForm initialCode={code.slice(0, 32)} />
    </div>
  );
}
