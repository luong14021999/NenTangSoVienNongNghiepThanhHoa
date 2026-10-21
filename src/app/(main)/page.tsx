import Link from "next/link";
import { Boxes, FlaskConical, Handshake, Microscope, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { dbQuery } from "@/lib/platform/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nền tảng số – Viện Nông nghiệp tỉnh Thanh Hóa" };

type Mod = {
  code: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  /** Màu nền ô vuông (gradient Tailwind). */
  color: string;
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
      color: "from-sky-500 to-blue-700",
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
      color: "from-emerald-500 to-teal-700",
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
      color: "from-amber-500 to-orange-600",
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
      color: "from-violet-500 to-purple-700",
      status: "Kế hoạch",
    },
    {
      code: "M3.2",
      name: "Giống cây trồng, vật nuôi, thủy sản",
      desc: "Lý lịch giống, nguồn gen, khảo nghiệm, chỉ thị phân tử, BLAST+, sản xuất giống, bản đồ cơ sở giống",
      icon: Sprout,
      color: "from-lime-500 to-green-700",
      status: "Kế hoạch",
    },
  ];
  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-6">
          {modules.map((m) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm sm:text-base font-bold opacity-90">{m.code}</span>
                  <span className="text-[10px] sm:text-xs font-medium rounded-full bg-white/20 px-2 py-0.5 text-right">{m.href ? m.status : "Sắp ra mắt"}</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <m.icon className="w-14 h-14 sm:w-20 sm:h-20 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-lg leading-tight">{m.name}</div>
                  {m.stats?.[0] && (
                    <div className="text-[11px] sm:text-xs opacity-80 mt-1">
                      <span className="font-semibold">{m.stats[0].value}</span> {m.stats[0].label}
                    </div>
                  )}
                </div>
              </>
            );
            const cls = `group aspect-square rounded-2xl p-4 sm:p-5 flex flex-col text-white shadow-sm bg-gradient-to-br ${m.color}`;
            return m.href ? (
              <Link key={m.code} href={m.href} title={m.desc} className={`${cls} transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring`}>
                {body}
              </Link>
            ) : (
              <div key={m.code} title={m.desc} aria-disabled className={`${cls} opacity-50 grayscale-[40%] cursor-not-allowed`}>
                {body}
              </div>
            );
          })}
        </section>
      </main>
    </>
  );
}
