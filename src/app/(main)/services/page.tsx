import {
  Sprout,
  Droplets,
  FlaskConical,
  Bug,
  GraduationCap,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Award,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { services, type ServiceGroup } from "@/lib/mock-data";

const groupIcon: Record<ServiceGroup, LucideIcon> = {
  "Phân tích đất": Sprout,
  "Phân tích nước": Droplets,
  "Phân tích phân bón": FlaskConical,
  "Phân tích BVTV": Bug,
  "Tư vấn nông nghiệp": GraduationCap,
};

const groupAccent: Record<ServiceGroup, string> = {
  "Phân tích đất": "bg-emerald-50 text-emerald-700",
  "Phân tích nước": "bg-blue-50 text-blue-600",
  "Phân tích phân bón": "bg-violet-50 text-violet-600",
  "Phân tích BVTV": "bg-rose-50 text-rose-600",
  "Tư vấn nông nghiệp": "bg-amber-50 text-amber-600",
};

function formatPrice(v: number) {
  if (v === 0) return "Miễn phí";
  return `${v.toLocaleString("vi-VN")} đ`;
}

const groups = Array.from(new Set(services.map((s) => s.group))) as ServiceGroup[];

const analysisServices = services.filter(
  (s) => s.group !== "Tư vấn nông nghiệp",
);
const advisoryServices = services.filter(
  (s) => s.group === "Tư vấn nông nghiệp",
);
const vilasCount = services.filter((s) => s.vilas).length;

const stats = [
  {
    label: "Dịch vụ phân tích",
    value: analysisServices.length,
    icon: FlaskConical,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Dịch vụ tư vấn",
    value: advisoryServices.length,
    icon: GraduationCap,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Được công nhận VILAS 1501",
    value: vilasCount,
    icon: Award,
    accent: "bg-violet-50 text-violet-600",
  },
  {
    label: "Nhóm dịch vụ",
    value: groups.length,
    icon: Globe,
    accent: "bg-amber-50 text-amber-600",
  },
];

export default function ServicesPage() {
  return (
    <>
      <Header
        title="Danh mục dịch vụ phân tích & tư vấn"
        description="19 dịch vụ phân tích + 6 nhóm tư vấn – phục vụ HTX, doanh nghiệp, cơ quan và nông hộ"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {s.label}
                  </div>
                  <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.accent}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh mục dịch vụ</CardTitle>
              <CardDescription>
                Bảng giá tham chiếu – có thể tùy biến theo hợp đồng KH lớn / KH
                thường xuyên
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2.5 h-9 text-sm w-full sm:w-56">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  className="bg-transparent outline-none flex-1"
                  placeholder="Tìm dịch vụ..."
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <Button size="sm">
                <Plus />
                Thêm dịch vụ
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                {groups.map((g) => (
                  <TabsTrigger key={g} value={g}>
                    {g}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {services.map((s) => {
                const Icon = groupIcon[s.group];
                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-lg border bg-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${groupAccent[s.group]}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-semibold">
                            {s.code}
                          </span>
                          {s.vilas && (
                            <Badge variant="success" className="text-[10px]">
                              <Award className="w-2.5 h-2.5" />
                              VILAS 1501
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium mt-0.5">
                          {s.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.description}
                    </div>
                    {s.methods && s.methods.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.methods.map((m) => (
                          <Badge
                            key={m}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {s.turnaround}
                      </span>
                      <span className="font-semibold text-sm text-primary">
                        {formatPrice(s.basePrice)}
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">
                          /{s.unit}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <CardTitle>Quy trình KH đặt dịch vụ</CardTitle>
            </div>
            <CardDescription>
              Đồng bộ với module Phiếu yêu cầu thử nghiệm và bảng giá tự chủ tài
              chính
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              {[
                {
                  title: "Chọn dịch vụ",
                  desc: "KH duyệt catalog, chọn dịch vụ phân tích + tư vấn cần thiết",
                },
                {
                  title: "Báo giá tự sinh",
                  desc: "Hệ thống tính giá theo bảng giá + chính sách CSKH",
                },
                {
                  title: "Ký hợp đồng",
                  desc: "Lập hợp đồng dịch vụ, ràng buộc cam kết bảo mật & thời gian",
                },
                {
                  title: "Tiếp nhận mẫu",
                  desc: "Mẫu về kho, sinh phiếu YC + mã mẫu theo yymmdd-XX/Y",
                },
                {
                  title: "Trả KQ + tư vấn",
                  desc: "Phiếu KQ + buổi tư vấn (nếu có) gắn kèm khuyến nghị",
                },
              ].map((s, i) => (
                <li
                  key={i}
                  className="p-3 rounded-md border bg-card flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {i + 1}
                    </div>
                    <div className="text-sm font-medium">{s.title}</div>
                  </div>
                  <div className="text-muted-foreground">{s.desc}</div>
                </li>
              ))}
            </ol>
            <div className="mt-3 p-3 rounded-md bg-emerald-50/60 border border-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                Catalog có thể public ra cổng KH (no-login) để KH/HTX tự xem giá
                và đặt dịch vụ. Phục vụ tinh thần tự chủ tài chính.
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
