import Link from "next/link";
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Download,
  FileSignature,
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
import { environmentStore } from "@/lib/modules/m2/data/environment";
import { AddEnvironmentReadingDialog } from "@/components/m2/environment/add-reading-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";

const ENV_FIELDS: CrudField[] = [
  { name: "room", label: "Phòng", required: true },
  {
    name: "parameter",
    label: "Thông số",
    type: "select",
    options: ["Nhiệt độ", "Độ ẩm"],
  },
  { name: "monitoringDevice", label: "Thiết bị kiểm soát", full: true },
  { name: "value", label: "Giá trị đo", type: "number" },
  { name: "unit", label: "ĐVT" },
  { name: "limit", label: "Giới hạn" },
  { name: "recordedAt", label: "Thời điểm", type: "datetime-local" },
  { name: "observer", label: "Người theo dõi" },
  { name: "pass", label: "Nhận xét", type: "bool" },
  { name: "note", label: "Ghi chú", full: true },
];

export const dynamic = "force-dynamic";

const MONTHS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const YEARS = ["2024", "2025", "2026", "2027"];

const PARAMS = ["Nhiệt độ", "Độ ẩm"] as const;

export default async function EnvironmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    room?: string;
    param?: string;
    month?: string;
    year?: string;
  }>;
}) {
  const sp = await searchParams;
  const all = await environmentStore.list();

  const rooms = Array.from(new Set(all.map((r) => r.room))).sort();

  const room = sp.room ?? rooms[0] ?? "P. Đất & Phân bón";
  const param = (sp.param as "Nhiệt độ" | "Độ ẩm") ?? "Nhiệt độ";
  const month = sp.month ?? "07";
  const year = sp.year ?? "2026";
  const yyyymm = `${year}-${month}`;

  // Chọn tất cả bản ghi khớp filter (1 phiếu = phòng × thông số × tháng)
  const sheet = all.filter(
    (r) =>
      r.room === room &&
      r.parameter === param &&
      r.recordedAt.startsWith(yyyymm),
  );

  const monitoringDevice = sheet[0]?.monitoringDevice ?? "—";
  const limit = sheet[0]?.limit ?? "—";
  const unit = sheet[0]?.unit ?? "";

  // Map ngày → bản ghi (nếu có nhiều lần đo cùng ngày, lấy cái mới nhất)
  const byDay = new Map<number, typeof sheet[number]>();
  for (const r of sheet) {
    const day = Number(r.recordedAt.slice(8, 10));
    const existing = byDay.get(day);
    if (!existing || r.recordedAt > existing.recordedAt) byDay.set(day, r);
  }

  const failCount = sheet.filter((r) => !r.pass).length;
  const passCount = sheet.filter((r) => r.pass).length;

  const stats = [
    {
      label: "Lần đo tháng này",
      value: sheet.length,
      icon: param === "Nhiệt độ" ? Thermometer : Droplets,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đạt",
      value: passCount,
      icon: CheckCircle2,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Không đạt",
      value: failCount,
      icon: AlertTriangle,
      accent: "bg-rose-50 text-rose-600",
    },
    {
      label: "Phòng đang giám sát",
      value: rooms.length,
      icon: Building2,
      accent: "bg-violet-50 text-violet-600",
    },
  ];

  function selectHref(patch: {
    room?: string;
    param?: string;
    month?: string;
    year?: string;
  }) {
    const p = new URLSearchParams({
      room,
      param,
      month,
      year,
      ...patch,
    });
    return `/environment?${p.toString()}`;
  }

  return (
    <>
      <Header
        title="Phiếu theo dõi môi trường"
        description="AEMD-BM-10.02 · ISO/IEC 17025:2017 §6.3 – Kiểm soát tiện nghi môi trường phòng phân tích"
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
              <CardTitle>Chọn phiếu theo tháng</CardTitle>
              <CardDescription>
                Mỗi phiếu = 1 phòng × 1 thông số × 1 tháng
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted-foreground">Phòng:</div>
              <select
                defaultValue={room}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[160px]"
                name="room-select"
                aria-label="Phòng"
              >
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Phòng:</span>
                <div className="flex flex-wrap gap-1">
                  {rooms.map((r) => (
                    <Link
                      key={r}
                      href={selectHref({ room: r })}
                      className={`px-2 py-1 rounded border text-[11px] ${
                        r === room
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent"
                      }`}
                    >
                      {r}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Thông số:</span>
                {PARAMS.map((p) => (
                  <Link
                    key={p}
                    href={selectHref({ param: p })}
                    className={`px-2 py-1 rounded border text-[11px] ${
                      p === param
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tháng:</span>
                {MONTHS.map((m) => (
                  <Link
                    key={m}
                    href={selectHref({ month: m })}
                    className={`px-1.5 py-0.5 rounded border text-[11px] tabular-nums ${
                      m === month
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    {m}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Năm:</span>
                {YEARS.map((y) => (
                  <Link
                    key={y}
                    href={selectHref({ year: y })}
                    className={`px-1.5 py-0.5 rounded border text-[11px] tabular-nums ${
                      y === year
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    {y}
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle>
                Phiếu theo dõi môi trường – Tháng {month}/{year}
              </CardTitle>
              <CardDescription>
                Mẫu AEMD-BM-10.02 lần ban hành 2 · in ra ký như bản giấy
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm">
                <Download />
                Xuất PDF
              </Button>
              <Button variant="outline" size="sm">
                <FileSignature />
                Ký duyệt
              </Button>
              <AddEnvironmentReadingDialog
                defaultRoom={room}
                defaultParameter={param}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="border rounded p-2">
                  <div className="text-muted-foreground uppercase text-[10px] font-semibold">
                    Phòng / vị trí kiểm soát
                  </div>
                  <div className="font-medium mt-0.5">{room}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-muted-foreground uppercase text-[10px] font-semibold">
                    Thiết bị dùng để kiểm soát
                  </div>
                  <div className="font-medium mt-0.5">{monitoringDevice}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-muted-foreground uppercase text-[10px] font-semibold">
                    Thông số + giới hạn
                  </div>
                  <div className="font-medium mt-0.5">
                    {param} · {limit}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[70px] text-center">
                        Ngày
                      </TableHead>
                      <TableHead>
                        Kết quả ({unit || "—"})
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        Nhận xét
                      </TableHead>
                      <TableHead>Người theo dõi</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead className="w-[110px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                      const r = byDay.get(day);
                      return (
                        <TableRow
                          key={day}
                          className={r ? "" : "opacity-60"}
                        >
                          <TableCell className="text-center font-mono">
                            {day}
                          </TableCell>
                          <TableCell className="font-medium">
                            {r ? (
                              <span
                                className={
                                  !r.pass ? "text-rose-600 font-semibold" : ""
                                }
                              >
                                {r.value} {r.unit}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {r ? (
                              <Badge
                                variant={r.pass ? "success" : "destructive"}
                                className="text-xs"
                              >
                                {r.pass ? "Đ" : "K"}
                              </Badge>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r?.observer ?? ""}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r?.note ?? ""}
                          </TableCell>
                          <TableCell>
                            {r && (
                              <div className="flex items-center justify-end gap-1.5">
                                <EntityFormDialog
                                  mode="edit"
                                  endpoint="/api/environment"
                                  id={r.id}
                                  title="Sửa lần đo môi trường"
                                  fields={ENV_FIELDS}
                                  initial={r}
                                  submitLabel="Lưu thay đổi"
                                />
                                <DeleteEntityButton
                                  entity="environment"
                                  id={r.id}
                                  label={`ngày ${day}`}
                                />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="text-xs text-muted-foreground italic pt-2 border-t">
                * Các thông số kiểm soát có thể thay đổi tùy yêu cầu (VD: nhiệt
                độ, độ ẩm, ánh sáng…).
                {sheet.length === 0 && (
                  <span className="text-rose-600 not-italic ml-1">
                    Chưa có lần đo nào cho phiếu này – bấm "Ghi nhận đo" để bắt
                    đầu.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bản ghi gần đây (mọi phiếu)</CardTitle>
            <CardDescription>
              20 lần đo mới nhất trên tất cả phòng và thông số
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Thông số</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Giới hạn</TableHead>
                    <TableHead>Nhận xét</TableHead>
                    <TableHead>Người theo dõi</TableHead>
                    <TableHead className="w-[110px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...all]
                    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
                    .slice(0, 20)
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs font-mono">
                          {r.recordedAt}
                        </TableCell>
                        <TableCell className="text-sm">{r.room}</TableCell>
                        <TableCell className="text-xs">{r.parameter}</TableCell>
                        <TableCell className="font-medium">
                          {r.value} {r.unit}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.limit}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.pass ? "success" : "destructive"}
                            className="text-xs"
                          >
                            {r.pass ? "Đ" : "K"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{r.observer}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <EntityFormDialog
                              mode="edit"
                              endpoint="/api/environment"
                              id={r.id}
                              title="Sửa lần đo môi trường"
                              fields={ENV_FIELDS}
                              initial={r}
                              submitLabel="Lưu thay đổi"
                            />
                            <DeleteEntityButton
                              entity="environment"
                              id={r.id}
                              label={`${r.room} · ${r.recordedAt}`}
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
