import {
  Archive,
  Filter,
  Snowflake,
  Thermometer,
  Box,
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Trash2,
} from "lucide-react";
import { archivedSamplesStore } from "@/lib/modules/m2/data/archived-samples";
import { AddArchivedSampleDialog } from "@/components/m2/archive/add-archived-sample-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";

export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { daysUntil } from "@/lib/platform/dates";
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
import { type ArchivedSample } from "@/lib/mock-data";

const statusVariant: Record<
  ArchivedSample["status"],
  "default" | "success" | "secondary"
> = {
  "Đang lưu": "default",
  "Đã phân tích QC": "success",
  "Đã hủy": "secondary",
};


function locationIcon(loc: string) {
  if (loc.toLowerCase().includes("đông")) return Snowflake;
  if (loc.toLowerCase().includes("lạnh")) return Thermometer;
  return Box;
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await archivedSamplesStore.list();
  const query = q.trim().toLowerCase();
  const archivedSamples = query
    ? all.filter(
        (s) =>
          s.archiveCode.toLowerCase().includes(query) ||
          s.originalSampleCode.toLowerCase().includes(query) ||
          s.customer.toLowerCase().includes(query) ||
          s.type.toLowerCase().includes(query) ||
          s.location.toLowerCase().includes(query),
      )
    : all;

  const active = all.filter((s) => s.status === "Đang lưu");
  const expiringSoon = active.filter((s) => daysUntil(s.expiryAt) <= 60);
  const qcDone = all.filter((s) => s.status === "Đã phân tích QC");
  const destroyed = all.filter((s) => s.status === "Đã hủy");

  const stats = [
    {
      label: "Mẫu đang lưu",
      value: active.length,
      icon: Archive,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Sắp hết hạn (≤ 60 ngày)",
      value: expiringSoon.length,
      icon: AlertTriangle,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Đã phân tích QC năm nay",
      value: qcDone.length,
      icon: ClipboardCheck,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Mẫu đã hủy",
      value: destroyed.length,
      icon: Trash2,
      accent: "bg-rose-50 text-rose-600",
    },
  ];

  const qcDueSchedule = [...active]
    .map((s) => {
      const archived = new Date(s.archivedAt);
      const nextQc = new Date(archived);
      nextQc.setMonth(nextQc.getMonth() + 3);
      return { ...s, nextQcAt: nextQc.toISOString().slice(0, 10) };
    })
    .sort((a, b) => daysUntil(a.nextQcAt) - daysUntil(b.nextQcAt))
    .slice(0, 5);

  return (
    <>
      <Header
        title="Kho mẫu lưu"
        description="Quản lý mẫu lưu phục vụ phân tích QC định kỳ 3 tháng/lần theo ISO/IEC 17025"
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

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh sách mẫu lưu</CardTitle>
              <CardDescription>
                Theo dõi vị trí, hạn lưu và mục đích – ràng buộc với mẫu gốc đã
                trả KQ
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntitySearchInput
                basePath="/archive"
                placeholder="Tìm mã lưu, mã mẫu gốc..."
              />
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 />
                Lập BB hủy
              </Button>
              <AddArchivedSampleDialog />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Đang lưu</TabsTrigger>
                <TabsTrigger value="qc">Đã phân tích QC</TabsTrigger>
                <TabsTrigger value="destroyed">Đã hủy</TabsTrigger>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-4 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mã mẫu lưu</TableHead>
                    <TableHead>Mẫu gốc</TableHead>
                    <TableHead>Loại mẫu</TableHead>
                    <TableHead>Vị trí</TableHead>
                    <TableHead>Ngày lưu</TableHead>
                    <TableHead>Hạn lưu</TableHead>
                    <TableHead>Lượng còn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[110px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedSamples.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {query
                          ? `Không có mẫu lưu nào khớp "${query}"`
                          : "Chưa có mẫu lưu nào"}
                      </TableCell>
                    </TableRow>
                  )}
                  {archivedSamples.map((s) => {
                    const expiryDays = daysUntil(s.expiryAt);
                    const expiringSoonFlag =
                      s.status === "Đang lưu" && expiryDays <= 60;
                    const Icon = locationIcon(s.location);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">
                          {s.archiveCode}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.originalSampleCode}
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {s.customer}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{s.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                              {s.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {s.archivedAt}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                expiringSoonFlag
                                  ? "text-warning font-medium text-xs"
                                  : "text-muted-foreground text-xs"
                              }
                            >
                              {s.expiryAt}
                            </span>
                            {expiringSoonFlag && (
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{s.amount}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[s.status]}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DeleteEntityButton
                            entity="archived-samples"
                            id={s.id}
                            label={s.archiveCode}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch phân tích mẫu lưu (3 tháng/lần)</CardTitle>
              <CardDescription>
                Tự sinh từ ngày lưu – phục vụ kiểm soát chất lượng nội bộ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {qcDueSchedule.map((s) => {
                  const days = daysUntil(s.nextQcAt);
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-md border bg-card"
                    >
                      <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {s.type}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {s.archiveCode} ← {s.originalSampleCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          QC: {s.nextQcAt}
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            days < 0
                              ? "text-destructive"
                              : days <= 14
                                ? "text-warning"
                                : "text-muted-foreground"
                          }`}
                        >
                          {days < 0
                            ? `Trễ ${Math.abs(days)} ngày`
                            : `Còn ${days} ngày`}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biên bản hủy mẫu gần đây</CardTitle>
              <CardDescription>
                Lưu trữ tối thiểu 5 năm phục vụ truy xuất ISO/IEC 17025
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {destroyed.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-md border bg-card"
                  >
                    <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {s.type}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {s.archiveCode} ← {s.originalSampleCode}
                      </div>
                      {s.qcNote && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {s.qcNote}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {s.qcAnalysisAt ?? s.expiryAt}
                    </div>
                  </li>
                ))}
                {destroyed.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    Chưa có mẫu nào bị hủy.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
