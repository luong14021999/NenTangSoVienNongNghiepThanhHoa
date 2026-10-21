import Link from "next/link";
import {
  Plus,
  Filter,
  Download,
  Printer,
  QrCode,
  User,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { fmtDateVN, todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type SampleStatus } from "@/lib/mock-data";
import { samplesStore } from "@/lib/data/samples";
import { AddSampleDialog } from "@/components/samples/add-sample-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";

export const dynamic = "force-dynamic";

const statusVariant: Record<
  SampleStatus,
  "secondary" | "default" | "warning" | "success" | "outline"
> = {
  "Đã tiếp nhận": "secondary",
  "Đang phân tích": "default",
  "Chờ duyệt": "warning",
  "Hoàn thành": "success",
  "Đã trả KQ": "outline",
};

export default async function SamplesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await samplesStore.list();
  const query = q.trim().toLowerCase();
  const samples = query
    ? all.filter(
        (s) =>
          s.code.toLowerCase().includes(query) ||
          s.customer.toLowerCase().includes(query) ||
          s.type.toLowerCase().includes(query) ||
          s.technician.toLowerCase().includes(query),
      )
    : all;
  const statusCounts = all.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  return (
    <>
      <Header
        title="Quản lý tiếp nhận mẫu"
        description="Yêu cầu phân tích, mã hóa mẫu tự động, theo dõi trạng thái và in phiếu nhận mẫu"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Phiếu tiếp nhận mẫu mới</CardTitle>
              <CardDescription>
                Mã mẫu được sinh tự động theo định dạng{" "}
                <span className="font-mono text-foreground">
                  M-YYYY-NNNNN
                </span>
                ; có thể in phiếu kèm mã QR sau khi lưu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Mã mẫu</Label>
                  <Input
                    id="code"
                    readOnly
                    defaultValue="M-2026-00322"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="received">Ngày tiếp nhận</Label>
                  <Input id="received" type="date" defaultValue={todayISO()} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="customer">Khách hàng</Label>
                  <Input
                    id="customer"
                    placeholder="Tên tổ chức / cá nhân yêu cầu phân tích"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type">Loại mẫu</Label>
                  <Input
                    id="type"
                    placeholder="VD: Nước thải, Đất, Phân bón, Thực phẩm..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="origin">Nguồn gốc / vị trí</Label>
                  <Input id="origin" placeholder="Khu vực lấy mẫu" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="criteria">Chỉ tiêu phân tích</Label>
                  <Input
                    id="criteria"
                    placeholder="Nhập danh sách chỉ tiêu, phân tách bằng dấu phẩy"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="due">Hạn trả kết quả</Label>
                  <Input id="due" type="date" defaultValue="2026-05-27" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tech">Phụ trách</Label>
                  <Input id="tech" placeholder="Kỹ thuật viên" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="outline">
                  <Printer />
                  In phiếu nhận mẫu
                </Button>
                <Button>
                  <Plus />
                  Lưu & tạo mẫu
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt trạng thái</CardTitle>
              <CardDescription>
                Phân bổ mẫu hiện tại theo trạng thái xử lý
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[status as SampleStatus]}>
                      {status}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="w-4 h-4" />
                  Tự sinh QR cho từng mẫu giúp tra cứu nhanh.
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh sách mẫu</CardTitle>
              <CardDescription>
                Tổng {all.length} mẫu{" "}
                {query && all.length !== samples.length
                  ? `· lọc còn ${samples.length}`
                  : "· lưu trong data/samples.json"}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
              <EntitySearchInput
                basePath="/samples"
                placeholder="Tìm mã, khách hàng..."
              />
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <Button variant="outline" size="sm">
                <Download />
                Xuất Excel
              </Button>
              <Link
                href={`/sample-labels?codes=${encodeURIComponent(samples.map((s) => s.code).join(","))}`}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border text-sm font-medium hover:bg-accent"
              >
                <QrCode className="w-4 h-4" /> In nhãn ({samples.length})
              </Link>
              <AddSampleDialog />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="in-progress">Đang phân tích</TabsTrigger>
                <TabsTrigger value="review">Chờ duyệt</TabsTrigger>
                <TabsTrigger value="done">Đã trả KQ</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-4 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mã mẫu</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Loại mẫu</TableHead>
                    <TableHead>Tiếp nhận</TableHead>
                    <TableHead>Hạn trả</TableHead>
                    <TableHead>Phụ trách</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[110px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samples.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {query
                          ? `Không có mẫu nào khớp "${query}"`
                          : "Chưa có mẫu nào"}
                      </TableCell>
                    </TableRow>
                  )}
                  {samples.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-medium">
                        <Link href={`/samples/${encodeURIComponent(s.code)}`} className="text-primary hover:underline" title="Hồ sơ hành trình mẫu">
                          {s.code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {s.customer}
                      </TableCell>
                      <TableCell>{s.type}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDateVN(s.receivedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDateVN(s.dueAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {s.technician}
                        </div>
                      </TableCell>
                      <TableCell className="w-[160px]">
                        <div className="flex items-center gap-2">
                          <Progress value={s.progress} className="flex-1" />
                          <span className="text-xs text-muted-foreground w-9 text-right">
                            {s.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[s.status]}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/sample-labels?codes=${encodeURIComponent(s.code)}`}
                            className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border text-xs font-medium hover:bg-accent"
                            title="In nhãn mã vạch / QR"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Nhãn
                          </Link>
                          <DeleteEntityButton
                            entity="samples"
                            id={s.id}
                            label={s.code}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
