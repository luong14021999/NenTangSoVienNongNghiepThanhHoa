import {
  TestTube,
  Filter,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  ClipboardCheck,
} from "lucide-react";
import { toolsStore } from "@/lib/data/tools";
import { supplyStore } from "@/lib/data/supplies";
import { toolUsageLogStore } from "@/lib/data/tool-usage-logs";
import { AddToolDialog } from "@/components/tools/add-tool-dialog";
import { EditToolDialog } from "@/components/tools/edit-tool-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { CrudTableCard } from "@/components/crud/crud-table-card";

const SUPPLY_FIELDS: CrudField[] = [
  { name: "code", label: "Mã vật tư", required: true, mono: true },
  { name: "name", label: "Tên vật tư", required: true, full: true },
  { name: "unit", label: "Đơn vị tính" },
  { name: "qty", label: "Số lượng tồn", type: "number" },
  { name: "minQty", label: "Tồn tối thiểu", type: "number" },
  { name: "location", label: "Vị trí" },
  { name: "note", label: "Ghi chú", full: true },
];

const TOOL_USAGE_FIELDS: CrudField[] = [
  { name: "itemName", label: "Tên dụng cụ / vật tư", required: true, full: true },
  { name: "qty", label: "Số lượng", type: "number" },
  { name: "unit", label: "Đơn vị tính" },
  { name: "importedAt", label: "Ngày nhập", type: "date" },
  { name: "status", label: "Tình trạng sử dụng" },
  { name: "user", label: "Người sử dụng" },
  { name: "note", label: "Ghi chú", full: true },
];

export const dynamic = "force-dynamic";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Tool } from "@/lib/mock-data";

const statusVariant: Record<
  Tool["status"],
  "success" | "default" | "destructive" | "warning"
> = {
  "Sẵn sàng": "success",
  "Đang dùng": "default",
  Hỏng: "destructive",
  "Chờ kiểm định": "warning",
};


export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await toolsStore.list();
  const query = q.trim().toLowerCase();
  const tools = query
    ? all.filter(
        (t) =>
          t.code.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.location.toLowerCase().includes(query) ||
          t.spec.toLowerCase().includes(query),
      )
    : all;

  const [supplies, toolUsageLogs] = await Promise.all([
    supplyStore.list(),
    toolUsageLogStore.list(),
  ]);

  const stats = [
    {
      label: "Đầu mục dụng cụ",
      value: all.length,
      icon: TestTube,
      accent: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Cần kiểm định",
      value: all.filter((t) => t.calibrationRequired).length,
      icon: ClipboardCheck,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Tồn dưới mức tối thiểu",
      value: all.filter((t) => t.qty < t.minQty).length,
      icon: AlertTriangle,
      accent: "bg-rose-50 text-rose-600",
    },
    {
      label: "Sẵn sàng sử dụng",
      value: all.filter((t) => t.status === "Sẵn sàng").length,
      icon: CheckCircle2,
      accent: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <>
      <Header
        title="Quản lý dụng cụ – vật tư"
        description="Dụng cụ thể tích/thủy tinh, danh mục vật tư, nhật ký sử dụng và lịch kiểm định"
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
              <CardTitle>Danh mục dụng cụ</CardTitle>
              <CardDescription>
                Bao gồm dụng cụ thể tích (có kiểm định) và vật tư
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntitySearchInput
                basePath="/tools"
                placeholder="Tìm mã, tên dụng cụ..."
              />
              <Button variant="outline" size="sm">
                <Filter />
                Lọc
              </Button>
              <Button variant="outline" size="sm">
                <PackagePlus />
                Nhập kho
              </Button>
              <AddToolDialog />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên dụng cụ</TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead>Đặc tính</TableHead>
                    <TableHead>Tồn</TableHead>
                    <TableHead className="w-[160px]">Mức tồn</TableHead>
                    <TableHead>Vị trí</TableHead>
                    <TableHead>Kiểm định</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[160px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        {query
                          ? `Không có dụng cụ nào khớp "${query}"`
                          : "Chưa có dụng cụ nào"}
                      </TableCell>
                    </TableRow>
                  )}
                  {tools.map((t) => {
                    const lowStock = t.qty < t.minQty;
                    const stockPct = Math.min(
                      100,
                      Math.round((t.qty / Math.max(t.minQty * 2, 1)) * 100),
                    );
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono">{t.code}</TableCell>
                        <TableCell className="font-medium max-w-[240px]">
                          {t.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary">{t.category}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[220px]">
                          {t.spec}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              lowStock ? "text-destructive font-medium" : ""
                            }
                          >
                            {t.qty} {t.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={stockPct} className="flex-1" />
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              tối thiểu {t.minQty}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {t.location}
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.calibrationRequired ? (
                            <div className="space-y-0.5">
                              <div className="text-muted-foreground">
                                Gần nhất: {t.lastCalibration ?? "—"}
                              </div>
                              <div>Kế tiếp: {t.nextCalibration ?? "—"}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Không yêu cầu
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[t.status]}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <EditToolDialog row={t} />
                            <DeleteEntityButton
                              entity="tools"
                              id={t.id}
                              label={t.name}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Danh mục vật tư */}
        <CrudTableCard
          title="Danh mục vật tư"
          description="Vật tư dùng chung phòng thí nghiệm – tồn kho & vị trí"
          endpoint="/api/supplies"
          entity="supplies"
          editFields={SUPPLY_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/supplies"
              title="Thêm vật tư"
              addLabel="Thêm vật tư"
              fields={SUPPLY_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Vật tư", "ĐVT", "Tồn", "Tối thiểu", "Vị trí"]}
          rows={supplies.map((s) => ({
            id: s.id,
            label: s.name,
            initial: s,
            cells: [
              <div key="vt">
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {s.code}
                </div>
              </div>,
              s.unit,
              <span
                key="ton"
                className={
                  s.qty < s.minQty ? "text-rose-600 font-medium" : "font-medium"
                }
              >
                {s.qty}
              </span>,
              <span key="min" className="text-muted-foreground text-sm">
                {s.minQty}
              </span>,
              s.location,
            ],
          }))}
        />

        {/* Nhật ký theo dõi sử dụng dụng cụ, vật tư */}
        <CrudTableCard
          title="Nhật ký theo dõi sử dụng dụng cụ, vật tư tiêu hao"
          description="Tên dụng cụ/vật tư, số lượng, ngày nhập và tình trạng sử dụng"
          endpoint="/api/tool-usage-logs"
          entity="tool-usage-logs"
          editFields={TOOL_USAGE_FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/tool-usage-logs"
              title="Thêm nhật ký sử dụng"
              addLabel="Thêm nhật ký"
              fields={TOOL_USAGE_FIELDS}
              submitLabel="Lưu"
            />
          }
          headers={["Tên dụng cụ / vật tư", "Số lượng", "Ngày nhập", "Tình trạng", "Người dùng"]}
          rows={toolUsageLogs.map((u) => ({
            id: u.id,
            label: u.itemName,
            initial: u,
            cells: [
              <span key="ten" className="font-medium text-sm">
                {u.itemName}
              </span>,
              <span key="sl" className="text-sm">
                {u.qty} {u.unit}
              </span>,
              <span key="nn" className="text-muted-foreground text-sm">
                {u.importedAt}
              </span>,
              <span key="tt" className="text-sm">
                {u.status}
              </span>,
              u.user,
            ],
          }))}
        />
      </main>
    </>
  );
}
