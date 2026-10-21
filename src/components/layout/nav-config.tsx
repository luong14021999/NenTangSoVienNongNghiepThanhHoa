"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  Wrench,
  Beaker,
  FileText,
  Settings,
  Users,
  TestTube,
  Users2,
  Gauge,
  Database,
  Network,
  Warehouse,
  TrendingUp,
  ShieldAlert,
  HeartPulse,
  UserCog,
  NotebookPen,
  BarChart3,
  Archive,
  Thermometer,
  ShieldCheck,
  AlertOctagon,
  Scale,
  Smartphone,
  FileSignature,
  Telescope,
  ClipboardEdit,
  MessageSquare,
  Briefcase,
  Award,
  ListChecks,
  FileStack,
  OctagonAlert,
  SearchCheck,
  Presentation,
  ShieldHalf,
  UserCheck,
  Truck,
  FlaskRound,
  ShieldBan,
  History,
  BadgeCheck,
  KeyRound,
  Calculator,
  LineChart,
  ServerCrash,
  FileSpreadsheet,
  Wallet,
  Leaf,
  FlaskConicalOff,
  Boxes,
  QrCode,
  Dna,
  Sprout,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };
/** Phân hệ của nền tảng: mỗi phân hệ gồm nhiều nhóm menu. */
export type NavModule = { code: string; name: string; groups: NavGroup[] };

/** Trang chủ: chọn phần mềm (không có sidebar). */
export const navHome: NavItem[] = [{ href: "/", label: "Trang chủ – các phần mềm", icon: LayoutDashboard }];

export const navModules: NavModule[] = [
  {
    code: "M1",
    name: "Nền tảng dùng chung",
    groups: [
      {
        label: "Tổng quan",
        items: [{ href: "/executive", label: "Bảng điều hành", icon: Gauge }],
      },
      {
        label: "Tài khoản & bảo mật",
        items: [
          { href: "/security", label: "An toàn thông tin", icon: ShieldAlert },
          { href: "/access-control", label: "Phân quyền", icon: KeyRound },
        ],
      },
      {
        label: "Dữ liệu dùng chung",
        items: [
          { href: "/master-data", label: "Danh mục dùng chung", icon: Database },
          { href: "/data-warehouse", label: "Kho dữ liệu", icon: Warehouse },
          { href: "/forecast", label: "Phân tích & dự báo", icon: TrendingUp },
          { href: "/integration", label: "Tích hợp & API (LGSP/NDXP)", icon: Network },
        ],
      },
      {
        label: "Vận hành hệ thống",
        items: [
          { href: "/system", label: "Giám sát & sao lưu", icon: HeartPulse },
          { href: "/change-log", label: "Nhật ký thay đổi", icon: History },
          { href: "/system-incidents", label: "Sự cố hệ thống", icon: ServerCrash },
          { href: "/software-validation", label: "Xác nhận phần mềm", icon: BadgeCheck },
          { href: "/settings", label: "Cấu hình", icon: Settings },
        ],
      },
    ],
  },
  {
    code: "M2",
    name: "Phòng thí nghiệm (LIMS)",
    groups: [
      {
        label: "Tổng quan",
        items: [
          { href: "/lims", label: "Bảng điều khiển PTN", icon: LayoutDashboard },
          { href: "/statistics", label: "Thống kê", icon: BarChart3 },
        ],
      },
      {
        label: "Nguồn lực",
        items: [
          { href: "/personnel", label: "Nhân sự PTN", icon: Users },
          { href: "/equipment", label: "Thiết bị PTN", icon: Wrench },
          { href: "/tools", label: "Dụng cụ – Vật tư", icon: TestTube },
          { href: "/chemicals", label: "Hóa chất", icon: Beaker },
          { href: "/authorizations", label: "Ủy quyền phép thử", icon: UserCheck },
          { href: "/commitments", label: "Cam kết khách quan & bảo mật", icon: ShieldHalf },
          { href: "/suppliers", label: "Nhà cung cấp", icon: Truck },
        ],
      },
      {
        label: "Nghiệp vụ",
        items: [
          { href: "/campaigns", label: "Quan trắc theo đợt", icon: Telescope },
          { href: "/field", label: "Lấy mẫu hiện trường", icon: Smartphone },
          { href: "/samples", label: "Tiếp nhận mẫu", icon: ClipboardList },
          { href: "/assignments", label: "Phân công công việc", icon: UserCog },
          { href: "/analysis", label: "Quy trình phân tích", icon: FlaskConical },
          { href: "/notebook", label: "Sổ tay thí nghiệm", icon: NotebookPen },
        ],
      },
      {
        label: "Phiếu / Biểu mẫu",
        items: [
          { href: "/test-requests", label: "Phiếu yêu cầu thử nghiệm", icon: FileSignature },
          { href: "/result-entry", label: "Phiếu diễn biến phân tích", icon: ClipboardEdit },
          { href: "/reports", label: "Phiếu kết quả thử nghiệm", icon: FileText },
          { href: "/environment", label: "Phiếu theo dõi môi trường", icon: Thermometer },
          { href: "/archive", label: "Sổ theo dõi mẫu lưu", icon: Archive },
          { href: "/feedback", label: "Phiếu ý kiến & khiếu nại", icon: MessageSquare },
        ],
      },
      {
        label: "Hệ thống quản lý ISO 17025",
        items: [
          { href: "/iso17025", label: "Tổng quan ISO 17025", icon: ListChecks },
          { href: "/documents", label: "Kiểm soát tài liệu", icon: FileStack },
          { href: "/nonconformities", label: "Không phù hợp & CAPA", icon: OctagonAlert },
          { href: "/internal-audits", label: "Đánh giá nội bộ", icon: SearchCheck },
          { href: "/management-reviews", label: "Xem xét của lãnh đạo", icon: Presentation },
          { href: "/release-rules", label: "Quy tắc kiểm soát phát hành", icon: ShieldBan },
        ],
      },
      {
        label: "Đảm bảo chất lượng",
        items: [
          { href: "/accreditation", label: "Phạm vi công nhận VILAS", icon: Award },
          { href: "/method-validations", label: "Xác nhận phương pháp", icon: FlaskRound },
          { href: "/calculation-methods", label: "Công thức tính & ĐKĐBĐ", icon: Calculator },
          { href: "/calibration-curves", label: "Đường chuẩn", icon: LineChart },
          { href: "/qc", label: "QC Levey-Jennings", icon: ShieldCheck },
          { href: "/risks", label: "Đăng ký rủi ro", icon: AlertOctagon },
          { href: "/decision-rules", label: "Quy tắc quyết định", icon: Scale },
        ],
      },
    ],
  },
  {
    code: "M4",
    name: "Dịch vụ KH&CN & khách hàng",
    groups: [
      {
        label: "Khách hàng & thị trường",
        items: [
          { href: "/customers", label: "Khách hàng", icon: Users2 },
          { href: "/services", label: "Dịch vụ & Tư vấn", icon: Briefcase },
        ],
      },
      {
        label: "Báo giá – Hợp đồng – Thu tiền",
        items: [
          { href: "/quotations", label: "Báo giá", icon: FileSpreadsheet },
          { href: "/contracts", label: "Hợp đồng & công nợ", icon: FileSignature },
          { href: "/payments", label: "Thanh toán", icon: Wallet },
        ],
      },
    ],
  },
  {
    code: "M3.1",
    name: "Nuôi cấy mô & truy xuất",
    groups: [
      {
        label: "Nuôi cấy",
        items: [
          { href: "/tissue-materials", label: "Vật liệu khởi đầu", icon: Leaf },
          { href: "/media-recipes", label: "Công thức môi trường", icon: FlaskConicalOff },
          { href: "/culture-batches", label: "Mẻ cấy & cấy chuyển", icon: Boxes },
        ],
      },
      {
        label: "Ra ngôi & truy xuất",
        items: [{ href: "/seedling-lots", label: "Lô cây giống & truy xuất", icon: QrCode }],
      },
    ],
  },
  {
    code: "M3.2",
    name: "Giống cây trồng, vật nuôi, thủy sản",
    groups: [
      {
        label: "Giống & nguồn gen",
        items: [
          { href: "/varieties", label: "Lý lịch giống", icon: Sprout },
          { href: "/germplasm", label: "Nguồn gen", icon: Dna },
          { href: "/breed-trials", label: "Khảo nghiệm", icon: ClipboardCheck },
        ],
      },
    ],
  },
];

/** Tất cả mục menu (dùng cho tìm kiếm / kiểm thử). */
export const navGroups: NavGroup[] = [{ label: "Tổng quan", items: navHome }, ...navModules.flatMap((m) => m.groups)];

export const isActiveHref = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

/** Phân hệ chứa trang hiện tại (theo menu); trang in / hồ sơ mẫu thuộc M2. */
export function moduleOf(pathname: string): NavModule | undefined {
  const byMenu = navModules.find((m) => m.groups.some((g) => g.items.some((i) => isActiveHref(i.href, pathname))));
  if (byMenu) return byMenu;
  if (/^\/(sample-labels|report-print|verify)(\/|$)/.test(pathname)) return navModules.find((m) => m.code === "M2");
  return undefined;
}

export function SidebarBrand() {
  return (
    <div className="min-h-16 py-2 flex items-center gap-2.5 px-3 border-b border-sidebar-border">
      <div className="w-9 h-9 rounded-full bg-white ring-1 ring-white/40 flex items-center justify-center shrink-0 overflow-hidden">
        <Image
          src="/logo-vnnth.png"
          alt="Viện Nông nghiệp tỉnh Thanh Hóa"
          width={36}
          height={36}
          className="w-9 h-9 object-contain"
          priority
        />
      </div>
      <div className="leading-tight min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-white leading-snug">
          Nền tảng số Viện Nông nghiệp
        </div>
        <div className="text-[10.5px] text-sidebar-foreground/60 mt-0.5 leading-snug">
          tỉnh Thanh Hóa
        </div>
      </div>
    </div>
  );
}

export function SidebarFooter() {
  return (
    <div className="p-3 border-t border-sidebar-border">
      <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-sidebar-accent/40">
        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-white text-xs font-semibold">
          NL
        </div>
        <div className="leading-tight text-xs min-w-0">
          <div className="text-white font-medium truncate">
            Nguyễn Đình Lương
          </div>
          <div className="text-sidebar-foreground/60 truncate">
            Trưởng phòng PTN
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const current = moduleOf(pathname);
  const item = (it: NavItem) => {
    const active = isActiveHref(it.href, pathname);
    const Icon = it.icon;
    return (
      <li key={it.href}>
        <Link
          href={it.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{it.label}</span>
        </Link>
      </li>
    );
  };
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2.5 py-2 mb-3 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span>Về trang chủ – các phần mềm</span>
      </Link>
      {current && (
        <>
          <div className="flex items-center gap-2 px-2 pb-3 mb-1 border-b border-sidebar-border">
            <span className="text-[10px] font-bold font-mono rounded bg-white/15 text-white px-1.5 py-0.5">{current.code}</span>
            <span className="flex-1 text-[13px] font-semibold text-white">{current.name}</span>
          </div>
          {current.groups.map((group) => (
            <div key={group.label} className="mt-3 mb-3 pl-1">
              <div className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{group.label}</div>
              <ul className="space-y-0.5">{group.items.map(item)}</ul>
            </div>
          ))}
        </>
      )}
    </nav>
  );
}
