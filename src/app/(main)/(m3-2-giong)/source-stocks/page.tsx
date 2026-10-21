import { TreePine, PawPrint, AlertTriangle, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { individualStore, sourceStockStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { STOCK_KINDS, STOCK_STATUSES, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nguồn giống gốc" };

const PLANT_KINDS = ["Cây đầu dòng", "Vườn cây đầu dòng"];

export default async function SourceStocksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, varieties, individuals] = await Promise.all([sourceStockStore.list(), varietyStore.list(), individualStore.list()]);
  const varietyById = byId(varieties);
  const today = todayISO();
  const fields: CrudField[] = [
    { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: NG-CDD-001" },
    { name: "kind", label: "Loại", type: "select", options: [...STOCK_KINDS] },
    { name: "name", label: "Tên (cây / vườn / đàn)", required: true, full: true },
    { name: "varietyId", label: "Giống", type: "select", options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "location", label: "Địa điểm" },
    { name: "quantity", label: "Số cây / con", type: "number" },
    { name: "status", label: "Tình trạng", type: "select", options: [...STOCK_STATUSES] },
    { name: "recognitionNo", label: "Số QĐ công nhận", mono: true },
    { name: "recognizedAt", label: "Ngày công nhận", type: "date" },
    { name: "validUntil", label: "Hiệu lực đến", type: "date" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => a.code.localeCompare(b.code)).filter((s) => matches(query, s.code, s.name, s.location, varietyById.get(s.varietyId)?.name));

  return (
    <>
      <Header title="Nguồn giống gốc" description="Cây đầu dòng, vườn cây đầu dòng; đàn giống gốc, ông bà, bố mẹ vật nuôi, thủy sản – quyết định công nhận và hiệu lực" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Cây / vườn đầu dòng", value: all.filter((s) => PLANT_KINDS.includes(s.kind)).length, icon: TreePine, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Đàn giống", value: all.filter((s) => !PLANT_KINDS.includes(s.kind)).length, icon: PawPrint, accent: "bg-blue-50 text-blue-600" },
            { label: "Cá thể có phả hệ", value: individuals.length, icon: Users, accent: "bg-violet-50 text-violet-600" },
            { label: "Công nhận sắp / hết hiệu lực", value: all.filter((s) => validityAlert(s.validUntil, today)).length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "trong 90 ngày" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/source-stocks" placeholder="Tìm mã, tên, địa điểm, giống…" />
        </div>
        <CrudTableCard
          title="Danh sách nguồn giống gốc"
          description="Cá thể (số tai, số hiệu cây), phả hệ và chỉ tiêu chọn lọc quản lý ở trang Phả hệ & chọn lọc"
          endpoint="/api/source-stocks"
          entity="source-stocks"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/source-stocks" title="Thêm nguồn giống gốc" fields={fields} addLabel="Thêm" />}
          headers={["Mã / loại", "Tên · giống", "Địa điểm · số lượng", "Công nhận", "Cá thể", "Tình trạng"]}
          emptyText={query ? "Không có mục phù hợp" : "Chưa có nguồn giống gốc"}
          rows={rows.map((s) => {
            const a = validityAlert(s.validUntil, today);
            return {
              id: s.id,
              label: s.name,
              initial: s,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{s.code}</div><div className="text-[11px] text-muted-foreground">{s.kind}</div></div>,
                <div key="n"><div className="text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">{varietyById.get(s.varietyId)?.name ?? "—"}</div></div>,
                <div key="l" className="text-xs">{s.location || "—"}<div className="text-muted-foreground">{s.quantity} {PLANT_KINDS.includes(s.kind) ? "cây" : "con"}</div></div>,
                <div key="r" className="text-xs">
                  <span className="font-mono">{s.recognitionNo || "—"}</span>
                  <div className="text-muted-foreground">{fmtDateVN(s.recognizedAt)}{s.validUntil && ` → ${fmtDateVN(s.validUntil)}`}</div>
                  {a && <div className={a.kind === "Hết hiệu lực" ? "text-rose-600 font-medium" : "text-amber-600"}>{a.kind} {a.days} ngày</div>}
                </div>,
                <span key="i" className="text-xs">{individuals.filter((i) => i.stockId === s.id).length}</span>,
                <Badge key="st" variant={s.status === "Đang khai thác" ? "success" : "secondary"}>{s.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
