import {
  Award,
  CalendarCheck,
  Droplets,
  FlaskConical,
  Mail,
  MapPin,
  Phone,
  Sprout,
  Apple,
  User,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccreditedTestsTable } from "@/components/accreditation/accredited-tests-table";
import {
  accreditationNotes,
  accreditedTests,
  labInfo,
  type AccreditedMatrix,
} from "@/lib/accreditation";

export const metadata = { title: "Phạm vi công nhận VILAS 1501" };
// Tính "còn X ngày" hiệu lực theo ngày truy cập, không theo lúc build.
export const dynamic = "force-dynamic";

const fmtDate = (iso: string) => iso.split("-").reverse().join("/");

const countBy = (...m: AccreditedMatrix[]) =>
  accreditedTests.filter((t) => m.includes(t.matrix)).length;

const stats: { label: string; value: number; icon: LucideIcon; accent: string }[] = [
  { label: "Đất", value: countBy("Đất"), icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
  { label: "Nước mặt, nước ngầm", value: countBy("Nước mặt, nước ngầm", "Nước mặt"), icon: Droplets, accent: "bg-blue-50 text-blue-600" },
  { label: "Phân bón", value: countBy("Phân bón"), icon: FlaskConical, accent: "bg-violet-50 text-violet-600" },
  { label: "Rau, quả", value: countBy("Rau, quả"), icon: Apple, accent: "bg-amber-50 text-amber-600" },
];

function daysUntil(iso: string) {
  const ms = new Date(`${iso}T23:59:59+07:00`).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export default function AccreditationPage() {
  const daysLeft = daysUntil(labInfo.validTo);
  const contacts: { icon: LucideIcon; label: string; value: string; href?: string }[] = [
    { icon: User, label: "Người quản lý", value: labInfo.manager },
    { icon: MapPin, label: "Địa chỉ", value: labInfo.address },
    { icon: Phone, label: "Điện thoại", value: labInfo.phone, href: `tel:${labInfo.phone.replace(/\./g, "")}` },
    { icon: Mail, label: "Email", value: labInfo.email, href: `mailto:${labInfo.email}` },
    { icon: Globe, label: "Website", value: labInfo.website.replace(/^https?:\/\//, ""), href: labInfo.website },
  ];

  return (
    <>
      <Header
        title="Phạm vi công nhận VILAS 1501"
        description={`Danh mục ${accreditedTests.length} phép thử được công nhận theo ${labInfo.standard} – lĩnh vực ${labInfo.field}`}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl font-bold">{labInfo.vilasCode}</span>
                    <Badge variant="secondary">{labInfo.standard}</Badge>
                    <Badge variant="outline">
                      Lĩnh vực: {labInfo.field} / {labInfo.fieldEn}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {labInfo.accreditedName} – {labInfo.organization}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Quyết định công nhận</div>
                    <div className="font-medium mt-0.5">Số {labInfo.decisionNo}</div>
                    <div className="text-xs text-muted-foreground">
                      ngày {fmtDate(labInfo.decisionDate)} – Văn phòng Công nhận chất lượng quốc gia (BoA)
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5" /> Hiệu lực công nhận
                    </div>
                    <div className="font-medium mt-0.5">
                      {fmtDate(labInfo.validFrom)} → {fmtDate(labInfo.validTo)}
                    </div>
                    <div className={`text-xs ${daysLeft <= 180 ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
                      {daysLeft > 0 ? `Còn ${daysLeft.toLocaleString("vi-VN")} ngày` : "Đã hết hiệu lực"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {contacts.map((c) => (
                <div key={c.label} className="flex items-start gap-2.5">
                  <c.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">{c.label}</div>
                    {c.href ? (
                      <a href={c.href} className="text-primary hover:underline break-words">
                        {c.value}
                      </a>
                    ) : (
                      <div className="break-words">{c.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {s.label}
                  </div>
                  <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                  <div className="text-xs text-muted-foreground">phép thử</div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.accent}`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Danh mục phép thử được công nhận</CardTitle>
            <CardDescription>
              List of accredited tests – theo phụ lục AFL 01.12, lần ban hành 6.26
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccreditedTestsTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
              {accreditationNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
