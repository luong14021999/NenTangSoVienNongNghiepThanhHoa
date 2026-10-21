import Link from "next/link";
import { Send, Search, ShieldCheck, QrCode, Award, FileDown, Megaphone, FlaskConical, Sprout, Microscope, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { accreditedTests, labInfo } from "@/lib/modules/m2/accreditation";
import { publicPriceList, publicResources } from "@/lib/modules/m4/data/portal";
import { fmtVND } from "@/lib/modules/m4/finance";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Cổng dịch vụ KH&CN – Viện Nông nghiệp tỉnh Thanh Hóa",
  description: "Gửi yêu cầu dịch vụ, tra cứu tình trạng, xác minh phiếu kết quả, truy xuất nguồn gốc lô giống; năng lực và bảng giá dịch vụ của Viện Nông nghiệp tỉnh Thanh Hóa",
};

const SERVICES = [
  { icon: FlaskConical, title: "Phân tích – thử nghiệm", text: "Đất, nước, phân bón, rau quả – phòng thử nghiệm đạt chuẩn ISO/IEC 17025, VILAS 1501" },
  { icon: Microscope, title: "Nuôi cấy mô – cây giống", text: "Nhân giống in vitro, cung ứng cây giống sạch bệnh có truy xuất nguồn gốc" },
  { icon: Sprout, title: "Giống cây trồng, vật nuôi, thủy sản", text: "Khảo nghiệm, sản xuất và cung ứng giống" },
  { icon: GraduationCap, title: "Tư vấn – chuyển giao", text: "Tư vấn kỹ thuật, chuyển giao tiến bộ KH&CN, tập huấn" },
];

function LookupBox({ icon: Icon, title, hint, action, placeholder }: { icon: typeof Search; title: string; hint: string; action: string; placeholder: string }) {
  return (
    <form action={action} method="get" className="rounded-xl border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold"><Icon className="w-5 h-5 text-primary" />{title}</div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex gap-2 mt-auto">
        <input name="code" required maxLength={64} placeholder={placeholder} className="flex-1 min-w-0 h-9 rounded-md border border-input bg-background px-3 text-sm font-mono" />
        <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium">Tra cứu</button>
      </div>
    </form>
  );
}

export default async function PortalPage() {
  const [prices, resources] = await Promise.all([publicPriceList(), publicResources()]);
  const matrices = [...new Set(accreditedTests.map((t) => t.matrix))];
  const priceGroups = [...new Set(prices.map((p) => p.category))];
  const forms = resources.filter((r) => r.kind === "Biểu mẫu");
  const others = resources.filter((r) => r.kind !== "Biểu mẫu");

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-card border p-5 sm:p-8">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Cổng dịch vụ khoa học và công nghệ</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-3xl">
          Gửi yêu cầu dịch vụ trực tuyến, theo dõi tình trạng xử lý, xác minh phiếu kết quả thử nghiệm và truy xuất nguồn gốc cây giống của Viện Nông nghiệp tỉnh Thanh Hóa.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <Link href="/portal/request" className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
            <Send className="w-4 h-4" /> Gửi yêu cầu dịch vụ
          </Link>
          <Link href="/portal/status" className="h-10 px-4 inline-flex items-center gap-2 rounded-md border bg-background text-sm font-medium hover:bg-accent">
            <Search className="w-4 h-4" /> Tra cứu yêu cầu đã gửi
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LookupBox icon={ShieldCheck} title="Xác minh phiếu kết quả" hint="Nhập số phiếu in trên phiếu kết quả thử nghiệm, hoặc quét mã QR trên phiếu." action="/portal/verify" placeholder="Số phiếu" />
        <LookupBox icon={QrCode} title="Truy xuất nguồn gốc lô giống" hint="Nhập mã lô in trên tem, hoặc quét mã QR trên tem cây giống." action="/trace" placeholder="VD: LO-2026-001" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Dịch vụ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-xl border bg-card p-4">
              <s.icon className="w-6 h-6 text-primary" />
              <div className="font-medium mt-2">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="nang-luc">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Năng lực & phạm vi công nhận</h2>
        <p className="text-sm text-muted-foreground mb-3">
          {labInfo.accreditedName} – {labInfo.vilasCode} theo {labInfo.standard}, Quyết định {labInfo.decisionNo} ngày {fmtDateVN(labInfo.decisionDate)}, hiệu lực đến {fmtDateVN(labInfo.validTo)}.
        </p>
        <div className="space-y-2">
          {matrices.map((m) => {
            const tests = accreditedTests.filter((t) => t.matrix === m);
            return (
              <details key={m} className="rounded-lg border bg-card">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium flex items-center justify-between">
                  {m} <span className="text-xs text-muted-foreground font-normal">{tests.length} phép thử</span>
                </summary>
                <ul className="px-4 pb-3 divide-y text-xs">
                  {tests.map((t) => (
                    <li key={t.no} className="py-1.5 flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
                      <span>{t.name}</span>
                      <span className="text-muted-foreground font-mono whitespace-nowrap">{t.method}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

      <section id="bang-gia">
        <h2 className="text-lg font-semibold mb-3">Bảng giá dịch vụ</h2>
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border bg-card p-4">Bảng giá đang được cập nhật. Vui lòng gửi yêu cầu để nhận báo giá.</p>
        ) : (
          <div className="space-y-4">
            {priceGroups.map((g) => (
              <div key={g} className="rounded-lg border bg-card overflow-x-auto">
                <div className="px-4 py-2 text-sm font-medium bg-muted/40 border-b">{g}</div>
                <table className="w-full text-xs">
                  <tbody className="divide-y">
                    {prices.filter((p) => p.category === g).map((p) => (
                      <tr key={p.code}>
                        <td className="px-4 py-2">
                          {p.name} {p.vilas && <Badge variant="outline" className="ml-1">VILAS</Badge>}
                          {p.method && <div className="text-muted-foreground">{p.method}</div>}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{p.turnaround}</td>
                        <td className="px-4 py-2 text-right font-semibold whitespace-nowrap">{fmtVND(p.price)} / {p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">Đơn giá chưa gồm thuế GTGT. Giá chính thức theo báo giá gửi kèm từng yêu cầu.</p>
          </div>
        )}
      </section>

      {(forms.length > 0 || others.length > 0) && (
        <section id="bieu-mau" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Biểu mẫu", icon: FileDown, items: forms },
            { title: "Hồ sơ năng lực & thông báo", icon: Megaphone, items: others },
          ]
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.title}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><g.icon className="w-5 h-5 text-primary" />{g.title}</h2>
                <ul className="rounded-lg border bg-card divide-y">
                  {g.items.map((r) => (
                    <li key={r.code} className="px-4 py-2.5 text-sm">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline font-medium">{r.title}</a>
                      ) : (
                        <span className="font-medium">{r.title}</span>
                      )}
                      {r.description && <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
