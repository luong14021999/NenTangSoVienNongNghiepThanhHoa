import Link from "next/link";
import { Database, Layers, CheckCircle2, History } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { MDM_STATUSES, listCatalogs, listItems } from "@/lib/platform/data/mdm";
import { fmtDateTimeVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Danh mục dùng chung" };

export default async function MasterDataPage({ searchParams }: { searchParams: Promise<{ c?: string; q?: string }> }) {
  const { c, q = "" } = await searchParams;
  const catalogs = await listCatalogs();
  const current = catalogs.find((x) => x.code === c) ?? catalogs[0];
  const items = current ? await listItems(current.code) : [];
  const query = q.trim().toLowerCase();
  const shown = items.filter((i) => !query || `${i.code} ${i.name} ${i.nameEn} ${i.parentCode}`.toLowerCase().includes(query));
  const fields = (code: string): CrudField[] => [
    { name: "catalogCode", label: "Danh mục", type: "select", options: [code] },
    { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: PT60" },
    { name: "name", label: "Tên", required: true, full: true },
    { name: "nameEn", label: "Tên tiếng Anh", full: true },
    { name: "parentCode", label: "Mã mục cha (nếu có)", mono: true },
    { name: "status", label: "Trạng thái", type: "select", options: [...MDM_STATUSES] },
    { name: "validFrom", label: "Hiệu lực từ", type: "date" },
    { name: "attrsText", label: "Thuộc tính bổ sung (JSON)", type: "textarea", placeholder: '{"phuongPhap": "TCVN …"}' },
  ];

  return (
    <>
      <Header title="Danh mục dùng chung (MDM)" description="M1.2 – một bản gốc cho mỗi danh mục; các phân hệ và hệ thống ngoài tham chiếu theo mã; mỗi lần sửa tăng phiên bản và ghi nhật ký" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Danh mục", value: catalogs.length, icon: Database, accent: "bg-blue-50 text-blue-600" },
            { label: "Mục", value: catalogs.reduce((s, x) => s + x.items, 0), icon: Layers, accent: "bg-violet-50 text-violet-600" },
            { label: "Còn hiệu lực", value: catalogs.reduce((s, x) => s + x.active, 0), icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Cập nhật gần nhất", value: catalogs.length ? fmtDateTimeVN(catalogs.map((x) => x.updatedAt).sort().at(-1)).slice(0, 10) : "—", icon: History, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <Card className="h-fit">
            <CardHeader className="pb-2"><CardTitle className="text-base">Danh mục</CardTitle><CardDescription>API: /api/v1/catalogs/&#123;mã&#125;</CardDescription></CardHeader>
            <CardContent className="space-y-1">
              {catalogs.map((x) => (
                <Link key={x.code} href={`/master-data?c=${x.code}`} className={`block rounded-lg px-3 py-2 text-sm ${current?.code === x.code ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                  <div className="font-medium">{x.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{x.code} · {x.active}/{x.items} mục</div>
                </Link>
              ))}
            </CardContent>
          </Card>
          {current && (
            <div className="space-y-3 min-w-0">
              <div className="rounded-lg border bg-card p-3 text-sm">
                <div className="font-semibold">{current.name} <span className="font-mono text-xs text-muted-foreground">{current.code}</span></div>
                <div className="text-xs text-muted-foreground mt-0.5">{current.description}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Chủ quản: {current.owner || "—"} · Nguồn: {current.source || "—"}</div>
              </div>
              <EntitySearchInput basePath="/master-data" placeholder="Tìm mã, tên…" />
              <CrudTableCard
                title={`Các mục (${shown.length})`}
                description="Mục không còn dùng: chuyển “Ngừng sử dụng” thay vì xoá để giữ tham chiếu lịch sử"
                endpoint="/api/mdm-items"
                entity="mdm-items"
                editFields={fields(current.code).filter((f) => f.name !== "catalogCode")}
                addNode={<EntityFormDialog mode="add" endpoint="/api/mdm-items" title={`Thêm mục – ${current.name}`} fields={fields(current.code)} addLabel="Thêm mục" />}
                headers={["Mã", "Tên", "Mục cha", "Thuộc tính", "Phiên bản", "Trạng thái"]}
                rows={shown.map((i) => ({
                  id: i.id,
                  label: `${i.code} – ${i.name}`,
                  initial: { ...i, attrsText: Object.keys(i.attrs).length ? JSON.stringify(i.attrs) : "" },
                  cells: [
                    <span key="c" className="font-mono text-xs">{i.code}</span>,
                    <div key="n" className="text-sm max-w-[360px]">{i.name}{i.nameEn && <div className="text-[11px] text-muted-foreground">{clip(i.nameEn, 80)}</div>}</div>,
                    <span key="p" className="font-mono text-xs">{i.parentCode || "—"}</span>,
                    <span key="a" className="text-[11px] text-muted-foreground max-w-[220px] inline-block">{clip(Object.entries(i.attrs).map(([k, v]) => `${k}: ${v}`).join(" · "), 90) || "—"}</span>,
                    <span key="v" className="text-xs whitespace-nowrap">v{i.version} · {fmtDateTimeVN(i.updatedAt).slice(0, 10)}<span className="block text-[10px] text-muted-foreground">{i.updatedBy}</span></span>,
                    <Badge key="s" variant={i.status === "Hiệu lực" ? "success" : "secondary"}>{i.status}</Badge>,
                  ],
                }))}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
