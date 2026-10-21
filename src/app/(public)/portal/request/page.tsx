import { PublicRequestForm } from "@/components/m4/portal/request-form";

export const metadata = { title: "Gửi yêu cầu dịch vụ – Viện Nông nghiệp tỉnh Thanh Hóa" };

export default async function PortalRequestPage({ searchParams }: { searchParams: Promise<{ kind?: string; desc?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Gửi yêu cầu dịch vụ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Yêu cầu được chuyển ngay đến đơn vị phụ trách (phòng thí nghiệm, nuôi cấy mô, giống hoặc bộ phận tư vấn). Sau khi gửi, bạn nhận một mã để tra cứu tình trạng.
        </p>
      </div>
      <PublicRequestForm initialKind={(sp.kind ?? "").slice(0, 60)} initialDescription={(sp.desc ?? "").slice(0, 500)} />
    </div>
  );
}
