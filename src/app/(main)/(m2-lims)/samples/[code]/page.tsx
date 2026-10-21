import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, QrCode, Route } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { samplesStore } from "@/lib/modules/m2/data/samples";
import { SAMPLE_EVENTS, assignmentStore, buildTimeline } from "@/lib/modules/m2/data/custody";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const dt = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
};

const EVENT_FIELDS = (code: string): CrudField[] => [
  { name: "sampleCode", label: "Mẫu", type: "select", options: [code] },
  { name: "event", label: "Sự kiện", type: "select", options: [...SAMPLE_EVENTS] },
  { name: "location", label: "Vị trí / nơi lưu", placeholder: "VD: Tủ lạnh TL-02, ngăn 3" },
  { name: "condition", label: "Tình trạng / điều kiện bảo quản", placeholder: "VD: 4 °C, niêm phong nguyên" },
  { name: "receiver", label: "Người nhận (khi bàn giao)", full: true },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  return { title: `Hành trình mẫu ${decodeURIComponent((await params).code)}` };
}

export default async function SampleCustodyPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const [samples, assigns, timeline] = await Promise.all([samplesStore.list(), assignmentStore.list(), buildTimeline(code)]);
  const s = samples.find((x) => x.code === code);
  if (!s) notFound();
  const destroyed = timeline.some((t) => t.event === "Hủy mẫu");
  const mine = assigns.filter((a) => a.sampleCode === code);

  return (
    <>
      <Header title={`Hồ sơ hành trình mẫu ${code}`} description="M2.1 · ISO/IEC 17025:2017 §7.4 – theo dõi mẫu từ tiếp nhận, phân tích, trả kết quả đến lưu / hủy" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/samples" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Danh sách mẫu
          </Link>
          <div className="flex gap-2">
            <Link href={`/sample-labels?codes=${encodeURIComponent(code)}`} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border text-sm font-medium hover:bg-accent">
              <QrCode className="w-4 h-4" /> In nhãn
            </Link>
            <EntityFormDialog mode="add" endpoint="/api/sample-events" title={`Ghi sự kiện – ${code}`} description="Người ghi và thời điểm lấy tự động" fields={EVENT_FIELDS(code)} addLabel="Ghi sự kiện" />
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {code} {destroyed ? <Badge variant="secondary">Đã hủy</Badge> : <Badge>{s.status}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <div><span className="text-muted-foreground">Khách hàng:</span> {s.customer}</div>
              <div><span className="text-muted-foreground">Loại mẫu:</span> {s.type}</div>
              <div><span className="text-muted-foreground">Tiếp nhận:</span> {fmtDateVN(s.receivedAt?.slice(0, 10))}</div>
              <div><span className="text-muted-foreground">Hạn trả:</span> {fmtDateVN(s.dueAt?.slice(0, 10))}</div>
              <div><span className="text-muted-foreground">Chỉ tiêu yêu cầu:</span> {s.criteria.join(", ") || "—"}</div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Phân công chỉ tiêu</CardTitle>
              <CardDescription><Link href={`/assignments?sample=${encodeURIComponent(code)}`} className="text-primary hover:underline">Phân công / theo dõi →</Link></CardDescription>
            </CardHeader>
            <CardContent>
              {mine.length === 0 && <div className="text-sm text-muted-foreground">Chưa phân công chỉ tiêu nào</div>}
              <ul className="space-y-1.5 text-sm">
                {mine.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2">
                    <Badge variant={a.status === "Hoàn thành" ? "success" : a.status === "Đang làm" ? "warning" : a.status === "Hủy" ? "secondary" : "default"}>{a.status}</Badge>
                    <span className="flex-1 min-w-0 truncate">{a.testLabel}</span>
                    <span className="text-xs text-muted-foreground">{a.assignee} · hạn {fmtDateVN(a.dueAt)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Route className="w-4 h-4" /> Chuỗi hành trình</CardTitle>
            <CardDescription>Sự kiện tự động (tiếp nhận, phân công, kết quả, phê duyệt, phiếu, lưu mẫu) và sự kiện ghi tay (bàn giao, bảo quản, trả / hủy mẫu)</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l-2 border-primary/20 ml-2 space-y-4">
              {timeline.map((t, i) => (
                <li key={i} className="ml-4">
                  <span className={`absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full ${t.kind === "manual" ? "bg-amber-500" : t.event.includes("Hủy") || t.event.includes("Thu hồi") ? "bg-rose-500" : "bg-primary"}`} />
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold">{t.event}</span>
                    <span className="text-xs text-muted-foreground">{dt(t.at)}{t.actor && ` · ${t.actor}`}</span>
                    {t.kind === "manual" && <Badge variant="outline" className="text-[10px]">ghi tay</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                    {t.link ? <Link href={t.link} className="hover:underline">{t.detail}</Link> : <span>{t.detail}</span>}
                    {t.id && <DeleteEntityButton entity="sample-events" id={t.id} label={`${t.event} ${dt(t.at)}`} />}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
