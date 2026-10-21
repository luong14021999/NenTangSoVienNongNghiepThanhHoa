import { Leaf, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { EXPLANT_TYPES, MATERIAL_STATUSES, tissueMaterialStore, type TissueMaterial } from "@/lib/modules/m3/data/tissue";
import { matches } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vật liệu khởi đầu" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã vật liệu", required: true, mono: true, placeholder: "VD: VL-2026-001" },
  { name: "species", label: "Loài", required: true, placeholder: "VD: Chuối, Lan, Mía…" },
  { name: "variety", label: "Giống" },
  { name: "source", label: "Nguồn (cây mẹ / nơi lấy)" },
  { name: "collectedAt", label: "Ngày lấy mẫu", type: "date" },
  { name: "explantType", label: "Loại mẫu cấy", type: "select", options: [...EXPLANT_TYPES] },
  { name: "quantity", label: "Số mẫu đưa vào", type: "number" },
  { name: "status", label: "Trạng thái", type: "select", options: [...MATERIAL_STATUSES] },
  { name: "sterilization", label: "Quy trình khử trùng (hóa chất, nồng độ, thời gian)", type: "textarea" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const statusVariant: Record<TissueMaterial["status"], "warning" | "success" | "destructive"> = {
  "Đang khử trùng": "warning",
  "Sạch – đưa vào nuôi cấy": "success",
  "Nhiễm – loại bỏ": "destructive",
};

export default async function TissueMaterialsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const all = (await tissueMaterialStore.list()).sort((a, b) => b.code.localeCompare(a.code));
  const query = q.trim().toLowerCase();
  const rows = all.filter((x) => matches(query, x.code, x.species, x.variety, x.source));
  const count = (s: TissueMaterial["status"]) => all.filter((x) => x.status === s).length;

  return (
    <>
      <Header title="Vật liệu khởi đầu" description="Mẫu cấy ban đầu: nguồn cây mẹ, loại mẫu, khử trùng và kết quả đưa vào nuôi cấy" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Vật liệu", value: all.length, icon: Leaf, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Đang khử trùng", value: count("Đang khử trùng"), icon: ShieldAlert, accent: "bg-amber-50 text-amber-600" },
            { label: "Sạch – vào nuôi cấy", value: count("Sạch – đưa vào nuôi cấy"), icon: CheckCircle2, accent: "bg-blue-50 text-blue-600" },
            { label: "Nhiễm – loại bỏ", value: count("Nhiễm – loại bỏ"), icon: XCircle, accent: "bg-rose-50 text-rose-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/tissue-materials" placeholder="Tìm mã, loài, giống, nguồn…" />
        </div>
        <CrudTableCard
          title="Danh sách vật liệu khởi đầu"
          description="Điểm đầu của chuỗi truy xuất: vật liệu → mẻ cấy → lô cây giống"
          endpoint="/api/tissue-materials"
          entity="tissue-materials"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/tissue-materials" title="Thêm vật liệu" fields={FIELDS} addLabel="Thêm vật liệu" />}
          headers={["Mã / ngày lấy", "Loài – giống", "Nguồn", "Mẫu cấy", "Khử trùng", "Trạng thái"]}
          emptyText={query ? "Không có vật liệu phù hợp" : "Chưa có vật liệu nào"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.code,
            initial: x,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{x.code}</div>
                <div className="text-[11px] text-muted-foreground">{fmtDateVN(x.collectedAt)}</div>
              </div>,
              <div key="s">
                <div className="text-sm font-medium">{x.species}</div>
                <div className="text-[11px] text-muted-foreground">{x.variety || "—"}</div>
              </div>,
              <span key="n" className="text-xs">{x.source || "—"}</span>,
              <span key="e" className="text-xs whitespace-nowrap">{x.explantType} · {x.quantity}</span>,
              <span key="k" className="text-xs text-muted-foreground">{clip(x.sterilization || "—", 60)}</span>,
              <Badge key="st" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
