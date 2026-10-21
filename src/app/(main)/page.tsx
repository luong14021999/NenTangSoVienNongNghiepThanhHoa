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
  status: "Đang vận hành" | "Đang xây dựng" | "Kế hoạch";
  stats?: { label: string; value: string | number }[];
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
  // Bảng M3/M4 nằm ở schema riêng (migration 0015) – chưa chạy migration thì ô vẫn hiện, chỉ thiếu số liệu.
  const [n] = await dbQuery(
    `select
       (select count(*)::int from m4.service_requests where status = 'Mới tiếp nhận') requests_new,
       (select count(*)::int from m4.contracts where status in ('Đã ký', 'Đang thực hiện')) contracts_open,
       (select count(*)::int from m3_tissue.culture_batches where status = 'Đang nuôi') batches_growing,
       (select count(*)::int from m3_breed.varieties) varieties`,
  ).catch(() => [{ requests_new: "—", contracts_open: "—", batches_growing: "—", varieties: "—" }]);
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
    },
    {
      code: "M4",
      name: "Nghiên cứu – dịch vụ – tra cứu KH&CN",
      desc: "Cổng tiếp nhận dịch vụ trực tuyến, tra cứu công khai, báo giá, hợp đồng, thanh toán, công nợ; nhiệm vụ KH&CN, kho tri thức, chuyển giao",
      icon: Handshake,
      color: "from-amber-500 to-orange-600",
      href: "/m4-overview",
      status: "Đang xây dựng",
      stats: [{ label: "yêu cầu mới chờ xử lý", value: n.requests_new }, { label: "hợp đồng đang thực hiện", value: n.contracts_open }],
    },
    {
      code: "M3.1",
      name: "Nuôi cấy mô & truy xuất nguồn gốc",
      desc: "Vật liệu khởi đầu, công thức môi trường, theo dõi mẻ cấy, nhiễm mẫu, ra ngôi, xuất bán và truy xuất nguồn gốc cây giống",
      icon: Microscope,
      color: "from-violet-500 to-purple-700",
      href: "/culture-batches",
      status: "Đang xây dựng",
      stats: [{ label: "mẻ cấy đang nuôi", value: n.batches_growing }],
    },
    {
      code: "M3.2",
      name: "Giống cây trồng, vật nuôi, thủy sản",
      desc: "Lý lịch giống, nguồn gen, khảo nghiệm, chỉ thị phân tử, BLAST+, sản xuất giống, bản đồ cơ sở giống",
      icon: Sprout,
      color: "from-lime-500 to-green-700",
      href: "/varieties",
      status: "Đang xây dựng",
      stats: [{ label: "giống trong lý lịch", value: n.varieties }],
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
