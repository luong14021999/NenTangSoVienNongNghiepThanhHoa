import {
  CheckCircle2,
  Clock,
  ClipboardCheck,
  FlaskConical,
  ShieldCheck,
  Filter,
  Plus,
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
import { analysisTasks } from "@/lib/mock-data";

const statusVariant = {
  "Chưa bắt đầu": "outline",
  "Đang thực hiện": "default",
  "Hoàn thành": "success",
  "QA/QC": "warning",
} as const;

const qaqcVariant = {
  Đạt: "success",
  "Chưa duyệt": "secondary",
  "Cần làm lại": "destructive",
} as const;

const stats = [
  {
    label: "Chỉ tiêu đang chạy",
    value: analysisTasks.filter((t) => t.status === "Đang thực hiện").length,
    icon: FlaskConical,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Chờ QA/QC",
    value: analysisTasks.filter((t) => t.status === "QA/QC").length,
    icon: ShieldCheck,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    label: "Đã hoàn thành",
    value: analysisTasks.filter((t) => t.status === "Hoàn thành").length,
    icon: CheckCircle2,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Chỉ tiêu chưa bắt đầu",
    value: analysisTasks.filter((t) => t.status === "Chưa bắt đầu").length,
    icon: Clock,
    accent: "bg-slate-100 text-slate-600",
  },
];

const workflow = [
  {
    step: 1,
    title: "Phân công kỹ thuật viên",
    desc: "Trưởng nhóm gán chỉ tiêu cho KTV phù hợp năng lực.",
  },
  {
    step: 2,
    title: "Thực hiện phân tích",
    desc: "KTV nhập kết quả gốc, gắn kèm dữ liệu raw từ thiết bị.",
  },
  {
    step: 3,
    title: "Kiểm soát QA/QC",
    desc: "Mẫu trắng, mẫu chuẩn, lặp – đối chiếu giới hạn chấp nhận.",
  },
  {
    step: 4,
    title: "Phê duyệt & trả kết quả",
    desc: "Trưởng phòng ký duyệt, tự sinh phiếu KQ điện tử.",
  },
];

export default function AnalysisPage() {
  return (
    <>
      <Header
        title="Quy trình phân tích"
        description="Phân công, theo dõi và kiểm soát QA/QC theo từng chỉ tiêu của mẫu"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Danh sách chỉ tiêu đang phân tích</CardTitle>
                <CardDescription>
                  Mỗi dòng tương ứng một chỉ tiêu trên một mẫu cụ thể
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter />
                  Lọc
                </Button>
                <Button size="sm">
                  <Plus />
                  Phân công
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Tất cả</TabsTrigger>
                  <TabsTrigger value="mine">Của tôi</TabsTrigger>
                  <TabsTrigger value="qa">Chờ QA/QC</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="mt-4 rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Mã mẫu</TableHead>
                      <TableHead>Chỉ tiêu</TableHead>
                      <TableHead>Phương pháp</TableHead>
                      <TableHead>KTV</TableHead>
                      <TableHead>Bắt đầu</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>QA/QC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisTasks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono">
                          {t.sampleCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {t.criterion}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.method}
                        </TableCell>
                        <TableCell>{t.technician}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.startedAt}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[t.status]}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={qaqcVariant[t.qaqc]}>{t.qaqc}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quy trình chuẩn ISO/IEC 17025</CardTitle>
              <CardDescription>
                Bốn bước phối hợp giữa KTV và quản lý PTN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {workflow.map((w) => (
                  <li key={w.step} className="flex gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {w.step}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{w.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {w.desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 p-3 rounded-md bg-emerald-50 text-emerald-700 text-xs flex items-start gap-2">
                <ClipboardCheck className="w-4 h-4 mt-0.5 shrink-0" />
                Toàn bộ dữ liệu thô (raw data) được lưu trữ phục vụ truy xuất
                lịch sử, đáp ứng yêu cầu ISO/IEC 17025.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
