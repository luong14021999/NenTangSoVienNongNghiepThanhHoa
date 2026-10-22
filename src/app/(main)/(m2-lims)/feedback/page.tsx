import {
  MessageSquare,
  MessageSquareText,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Send,
  Star,
  Inbox,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { feedbackStore } from "@/lib/modules/m2/data/feedback";
import { AddFeedbackDialog } from "@/components/m2/feedback/add-feedback-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";

export const dynamic = "force-dynamic";

const ratingScore: Record<string, number> = {
  "Nhiệt tình": 4,
  Tốt: 4,
  Nhanh: 4,
  Khá: 3,
  "Đúng hạn": 3,
  "Hợp lý": 3,
  "Bình thường": 2,
  "Trung bình": 2,
  Cao: 2,
  Thấp: 2,
  Chậm: 1,
  Kém: 1,
};

const ratingColor: Record<string, string> = {
  "Nhiệt tình": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Tốt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Nhanh: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Khá: "bg-blue-50 text-blue-700 border-blue-200",
  "Đúng hạn": "bg-blue-50 text-blue-700 border-blue-200",
  "Hợp lý": "bg-blue-50 text-blue-700 border-blue-200",
  "Bình thường": "bg-amber-50 text-amber-700 border-amber-200",
  "Trung bình": "bg-amber-50 text-amber-700 border-amber-200",
  Cao: "bg-amber-50 text-amber-700 border-amber-200",
  Thấp: "bg-amber-50 text-amber-700 border-amber-200",
  Chậm: "bg-rose-50 text-rose-700 border-rose-200",
  Kém: "bg-rose-50 text-rose-700 border-rose-200",
};

type ComplaintStatus = "Mới" | "Đang xử lý" | "Đã trả lời" | "Đã đóng";

const complaintVariant: Record<
  ComplaintStatus,
  "destructive" | "warning" | "default" | "success"
> = {
  Mới: "destructive",
  "Đang xử lý": "warning",
  "Đã trả lời": "default",
  "Đã đóng": "success",
};

const dimensions = [
  { key: "serviceAttitude" as const, label: "Thái độ phục vụ" },
  { key: "fee" as const, label: "Phí dịch vụ" },
  { key: "quality" as const, label: "Chất lượng thử nghiệm" },
  { key: "infoAvailability" as const, label: "Sẵn có thông tin" },
  { key: "deliveryTime" as const, label: "Thời hạn trả KQ" },
];

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await feedbackStore.list();
  const query = q.trim().toLowerCase();
  const customerFeedbacks = query
    ? all.filter(
        (f) =>
          f.code.toLowerCase().includes(query) ||
          (f.customerName ?? "").toLowerCase().includes(query) ||
          (f.comments ?? "").toLowerCase().includes(query),
      )
    : all;

  function avgRating(field: keyof (typeof all)[number]) {
    if (all.length === 0) return "0.0";
    const total = all.reduce((sum, f) => {
      const val = f[field] as string;
      return sum + (ratingScore[val] ?? 0);
    }, 0);
    return (total / all.length).toFixed(1);
  }

  const complaints = all.filter((f) => f.isComplaint);
  const positive = all.filter(
    (f) =>
      !f.isComplaint &&
      (ratingScore[f.quality] ?? 0) >= 3 &&
      (ratingScore[f.serviceAttitude] ?? 0) >= 3,
  );

  const stats = [
    {
      label: "Tổng phiếu ý kiến",
      value: all.length,
      icon: MessageSquare,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đánh giá tích cực",
      value: positive.length,
      icon: MessageSquareText,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Khiếu nại cần xử lý",
      value: complaints.filter((c) => c.complaintStatus !== "Đã đóng").length,
      icon: AlertTriangle,
      accent: "bg-rose-50 text-rose-600",
    },
    {
      label: "Đã xử lý xong",
      value: complaints.filter(
        (c) =>
          c.complaintStatus === "Đã trả lời" || c.complaintStatus === "Đã đóng",
      ).length,
      icon: CheckCircle2,
      accent: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <>
      <Header
        title="Phiếu thu thập ý kiến khách hàng"
        description="Form AEMD-BM-08.01 · ISO/IEC 17025:2017 §7.9 (khiếu nại) + §8.6 (cải tiến)"
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
          <CardHeader>
            <CardTitle>Điểm đánh giá trung bình theo 5 tiêu chí</CardTitle>
            <CardDescription>
              Quy đổi thang 4 điểm – nhằm theo dõi xu hướng hài lòng KH
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {dimensions.map((d) => {
                const avg = parseFloat(avgRating(d.key));
                const pct = (avg / 4) * 100;
                return (
                  <div
                    key={d.key}
                    className="rounded-lg border bg-card p-3 space-y-2"
                  >
                    <div className="text-xs text-muted-foreground">
                      {d.label}
                    </div>
                    <div className="text-2xl font-bold flex items-baseline gap-1">
                      {avg}
                      <span className="text-xs text-muted-foreground">
                        / 4
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${
                          avg >= 3.5
                            ? "bg-emerald-500"
                            : avg >= 2.5
                              ? "bg-blue-500"
                              : avg >= 1.5
                                ? "bg-amber-500"
                                : "bg-rose-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh sách phiếu ý kiến & khiếu nại</CardTitle>
              <CardDescription>
                Phân loại theo dimension – khiếu nại tự gắn cờ và vào pipeline
                xử lý
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntitySearchInput
                basePath="/feedback"
                placeholder="Tìm mã, KH, nội dung..."
              />
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <AddFeedbackDialog />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="positive">Tích cực</TabsTrigger>
                <TabsTrigger value="complaints">Khiếu nại</TabsTrigger>
                <TabsTrigger value="processing">Đang xử lý</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-4 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mã</TableHead>
                    <TableHead>KH</TableHead>
                    <TableHead>Thái độ</TableHead>
                    <TableHead>Phí</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>Thông tin</TableHead>
                    <TableHead>Hạn KQ</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Khiếu nại</TableHead>
                    <TableHead className="w-[110px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerFeedbacks.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {query
                          ? `Không có phiếu nào khớp "${query}"`
                          : "Chưa có phiếu nào"}
                      </TableCell>
                    </TableRow>
                  )}
                  {customerFeedbacks.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">
                        {f.code}
                      </TableCell>
                      <TableCell className="text-sm">
                        {f.customerName ?? (
                          <span className="text-muted-foreground italic">
                            Ẩn danh
                          </span>
                        )}
                        {f.customerKind && (
                          <div className="text-[10px] text-muted-foreground">
                            {f.customerKind}
                          </div>
                        )}
                      </TableCell>
                      {[
                        f.serviceAttitude,
                        f.fee,
                        f.quality,
                        f.infoAvailability,
                        f.deliveryTime,
                      ].map((v, i) => (
                        <TableCell key={i}>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${
                              ratingColor[v] ?? ""
                            }`}
                          >
                            {v}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-muted-foreground">
                        {f.submittedAt}
                      </TableCell>
                      <TableCell>
                        {f.isComplaint && f.complaintStatus ? (
                          <Badge
                            variant={
                              complaintVariant[
                                f.complaintStatus as ComplaintStatus
                              ]
                            }
                          >
                            {f.complaintStatus}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            –
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DeleteEntityButton
                          entity="feedback"
                          id={f.id}
                          label={f.code}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {complaints.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-rose-600" />
                <CardTitle>Pipeline xử lý khiếu nại</CardTitle>
              </div>
              <CardDescription>
                §7.9 ISO/IEC 17025:2017 – mỗi khiếu nại có vòng đời và người chịu
                trách nhiệm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {complaints.map((c) => (
                  <li
                    key={c.id}
                    className="p-3 rounded-md border bg-card space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold">
                            {c.code}
                          </span>
                          {c.complaintStatus && (
                            <Badge
                              variant={
                                complaintVariant[
                                  c.complaintStatus as ComplaintStatus
                                ]
                              }
                            >
                              {c.complaintStatus}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {c.customerName ?? "(Ẩn danh)"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {c.submittedAt}
                        </div>
                      </div>
                    </div>
                    {c.comments && (
                      <div className="text-xs italic bg-muted/40 p-2 rounded">
                        "{c.comments}"
                      </div>
                    )}
                    {c.responseNote && (
                      <div className="text-xs border-l-2 border-emerald-500 pl-2 py-1">
                        <span className="font-medium">
                          Phản hồi từ {c.responder}
                        </span>
                        {c.responseDate && (
                          <span className="text-muted-foreground ml-1">
                            ({c.responseDate})
                          </span>
                        )}
                        : {c.responseNote}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mẫu phiếu thu thập ý kiến khách hàng</CardTitle>
            <CardDescription>
              AEMD-BM-08.01 · Lần ban hành 1 – mẫu chính thức của Viện
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-card p-5 max-w-2xl mx-auto space-y-4 text-sm">
              <div className="text-center border-b pb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Viện Nông nghiệp tỉnh Thanh Hóa · Phòng phân tích Đất, nước, phân bón và môi trường
                </div>
                <div className="text-base font-bold mt-1">
                  Phiếu thu thập ý kiến khách hàng
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                  AEMD-BM-08.01
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Cảm ơn quý khách trong thời gian qua đã chọn dịch vụ của Viện
                Nông nghiệp Thanh Hóa. Để chúng tôi phục vụ quý khách tốt hơn
                trong thời gian tới, xin quý khách vui lòng nhận xét theo bảng
                sau (tích vào ô thích hợp):
              </p>

              {[
                {
                  label: "Thái độ phục vụ",
                  options: ["Nhiệt tình", "Tốt", "Bình thường", "Kém"],
                },
                {
                  label: "Phí dịch vụ",
                  options: ["Cao", "Hợp lý", "Thấp"],
                },
                {
                  label: "Chất lượng thử nghiệm",
                  options: ["Tốt", "Khá", "Trung bình", "Kém"],
                },
                {
                  label: "Sự sẵn có thông tin của Viện",
                  options: ["Tốt", "Khá", "Trung bình", "Kém"],
                },
                {
                  label: "Thời hạn trả kết quả",
                  options: ["Nhanh", "Đúng hạn", "Bình thường", "Chậm"],
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1fr_auto] gap-3 items-start py-1 border-b border-dashed"
                >
                  <div className="text-xs font-medium">{row.label}</div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {row.options.map((o) => (
                      <label
                        key={o}
                        className="text-[11px] flex items-center gap-1"
                      >
                        <span className="w-3.5 h-3.5 border rounded-sm" />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-1.5">
                <div className="text-xs font-medium">
                  Các ý kiến đóng góp khác
                </div>
                <div className="h-16 rounded-md border border-dashed bg-muted/30" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">
                    Tên khách hàng (nếu cần thiết)
                  </div>
                  <div className="h-6 border-b border-dashed mt-1" />
                </div>
                <div>
                  <div className="text-muted-foreground">Ngày góp ý kiến</div>
                  <div className="h-6 border-b border-dashed mt-1" />
                </div>
              </div>

              <div className="text-center text-xs italic text-muted-foreground pt-2">
                Trân trọng cảm ơn quý khách.
              </div>

              <div className="flex justify-center gap-2 pt-3 border-t">
                <Button variant="outline" size="sm">
                  <Star className="w-3.5 h-3.5" />
                  Xem mẫu giấy
                </Button>
                <Button size="sm">
                  <Send className="w-3.5 h-3.5" />
                  Gửi phiếu cho KH
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
