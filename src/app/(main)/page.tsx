import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Boxes, FlaskConical, Handshake, Microscope, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nền tảng số – Viện Nông nghiệp tỉnh Thanh Hóa" };

type Mod = {
  code: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  href?: string;
  status: "Đang vận hành" | "Kế hoạch";
  stats?: { label: string; value: string | number }[];
  links?: { href: string; label: string }[];
};

/** Trang chủ: chọn phân hệ của nền tảng số Viện. */
export default async function PortalPage() {
  const [k] = await dbQuery(
    `select
       (select count(*)::int from analytics.fact_samples where first_issued_at is null) samples_open,
       (select count(*)::int from public.test_reports where status = 'Đã phát hành') reports,
       (select count(*)::int from public.mdm_catalogs) catalogs,
       (select count(*)::int from public.api_clients where active) api_keys,
       (select count(*)::int from public.customers) customers,
       (select count(*)::int from public.test_requests where status in ('Yêu cầu mới', 'Đã báo giá')) requests_open`,
  );
  const modules: Mod[] = [
    {
      code: "M1",
      name: "Nền tảng dùng chung",
      desc: "Đăng nhập & xác thực 2 lớp, danh mục dùng chung, API và kết nối LGSP/NDXP, kho dữ liệu, điều hành, dự báo, an toàn thông tin",
      icon: Boxes,
      href: "/executive",
      status: "Đang vận hành",
      stats: [{ label: "danh mục", value: k.catalogs }, { label: "khóa API hoạt động", value: k.api_keys }],
      links: [{ href: "/master-data", label: "Danh mục" }, { href: "/integration", label: "Tích hợp" }, { href: "/security", label: "An toàn TT" }],
    },
    {
      code: "M2",
      name: "Phòng thí nghiệm (LIMS)",
      desc: "Phòng phân tích Đất, nước, phân bón và môi trường – VILAS 1501: tiếp nhận mẫu, phân tích, QA/QC, phiếu kết quả theo ISO/IEC 17025",
      icon: FlaskConical,
      href: "/lims",
      status: "Đang vận hành",
      stats: [{ label: "mẫu chưa trả kết quả", value: k.samples_open }, { label: "phiếu đã phát hành", value: k.reports }],
      links: [{ href: "/samples", label: "Tiếp nhận mẫu" }, { href: "/result-entry", label: "Nhập kết quả" }, { href: "/reports", label: "Phiếu KQ" }],
    },
    {
      code: "M4",
      name: "Dịch vụ KH&CN & khách hàng",
      desc: "Cổng tiếp nhận dịch vụ trực tuyến, báo giá, hợp đồng, thanh toán, công nợ, quan hệ khách hàng",
      icon: Handshake,
      href: "/customers",
      status: "Kế hoạch",
      stats: [{ label: "khách hàng", value: k.customers }, { label: "yêu cầu chờ báo giá / chấp nhận", value: k.requests_open }],
      links: [{ href: "/customers", label: "Khách hàng" }, { href: "/services", label: "Dịch vụ" }],
    },
    {
      code: "M3.1",
      name: "Nuôi cấy mô & truy xuất nguồn gốc",
      desc: "Vật liệu khởi đầu, công thức môi trường, theo dõi mẻ cấy, nhiễm mẫu, ra ngôi, xuất bán và truy xuất nguồn gốc cây giống",
      icon: Microscope,
      status: "Kế hoạch",
    },
    {
      code: "M3.2",
      name: "Giống cây trồng, vật nuôi, thủy sản",
      desc: "Lý lịch giống, nguồn gen, khảo nghiệm, chỉ thị phân tử, BLAST+, sản xuất giống, bản đồ cơ sở giống",
      icon: Sprout,
      status: "Kế hoạch",
    },
  ];
  return (
    <>
      <Header title="Nền tảng số Viện Nông nghiệp tỉnh Thanh Hóa" description="Chọn phân hệ – một tài khoản, một lần đăng nhập cho tất cả" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="rounded-xl border bg-primary/5 p-4 sm:p-5 flex items-center gap-4">
          <Image src="/logo-vnnth.png" alt="Viện Nông nghiệp tỉnh Thanh Hóa" width={56} height={56} className="w-14 h-14 rounded-full bg-white object-contain ring-1 ring-primary/20" priority />
          <div className="min-w-0">
            <div className="text-sm font-semibold">Viện Nông nghiệp tỉnh Thanh Hóa</div>
            <div className="text-xs text-muted-foreground">271 Nguyễn Thục, phường Đông Quang, tỉnh Thanh Hoá · ĐT 02373.952.119</div>
          </div>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((m) => {
            const body = (
              <>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${m.href ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <m.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold">{m.code}</span>
                      <Badge variant={m.status === "Đang vận hành" ? "success" : "secondary"}>{m.status}</Badge>
                    </div>
                    <div className="font-semibold mt-0.5">{m.name}</div>
                  </div>
                  {m.href && <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{m.desc}</p>
                {m.stats && (
                  <div className="flex gap-4 mt-3">
                    {m.stats.map((s) => (
                      <div key={s.label}><div className="text-xl font-semibold">{s.value}</div><div className="text-[11px] text-muted-foreground">{s.label}</div></div>
                    ))}
                  </div>
                )}
              </>
            );
            return (
              <div key={m.code} className={`group rounded-xl border bg-card p-4 flex flex-col ${m.href ? "hover:border-primary/50 hover:shadow-sm" : "opacity-70"}`}>
                {m.href ? <Link href={m.href} className="block">{body}</Link> : body}
                {m.links && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                    {m.links.map((l) => (
                      <Link key={l.href} href={l.href} className="text-xs rounded-full border px-2.5 py-1 hover:bg-accent">{l.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </>
  );
}
