import { Dna, Snowflake, AlertTriangle, Trees } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { BREED_KINDS, CONSERVATION_METHODS, GERMPLASM_STATUSES, germplasmStore, type Germplasm } from "@/lib/modules/m3/data/breeding";
import { matches } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nguồn gen" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Số đăng ký nguồn gen", required: true, mono: true, placeholder: "VD: NG-0001" },
  { name: "kind", label: "Nhóm", type: "select", options: [...BREED_KINDS] },
  { name: "species", label: "Loài", required: true },
  { name: "localName", label: "Tên địa phương" },
  { name: "collectedAt", label: "Ngày thu thập", type: "date" },
  { name: "collectionSite", label: "Nơi thu thập" },
  { name: "conservation", label: "Hình thức lưu giữ", type: "select", options: [...CONSERVATION_METHODS] },
  { name: "quantity", label: "Số lượng lưu giữ", placeholder: "VD: 500 g hạt, 20 cây, 30 con" },
  { name: "status", label: "Trạng thái", type: "select", options: [...GERMPLASM_STATUSES] },
  { name: "evaluation", label: "Đánh giá đặc tính", type: "textarea" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const statusVariant: Record<Germplasm["status"], "success" | "warning" | "destructive"> = {
  "Đang lưu giữ": "success",
  "Cần phục tráng": "warning",
  "Đã mất": "destructive",
};

export default async function GermplasmPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const all = (await germplasmStore.list()).sort((a, b) => a.code.localeCompare(b.code));
  const query = q.trim().toLowerCase();
  const rows = all.filter((x) => matches(query, x.code, x.species, x.localName, x.collectionSite));

  return (
    <>
      <Header title="Nguồn gen" description="Tập đoàn nguồn gen lưu giữ: thu thập, hình thức bảo tồn, đánh giá đặc tính và phục tráng" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Mẫu nguồn gen", value: all.length, icon: Dna, accent: "bg-violet-50 text-violet-600" },
            { label: "Lưu giữ đồng ruộng / trang trại", value: all.filter((x) => x.conservation === "Đồng ruộng" || x.conservation === "Trang trại").length, icon: Trees, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Kho lạnh / in vitro / đông lạnh", value: all.filter((x) => ["Kho lạnh", "In vitro", "Đông lạnh"].includes(x.conservation)).length, icon: Snowflake, accent: "bg-blue-50 text-blue-600" },
            { label: "Cần phục tráng", value: all.filter((x) => x.status === "Cần phục tráng").length, icon: AlertTriangle, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/germplasm" placeholder="Tìm số đăng ký, loài, tên địa phương, nơi thu thập…" />
        </div>
        <CrudTableCard
          title="Danh sách nguồn gen"
          description="Mẫu Cần phục tráng cần được nhân lại để giữ sức sống"
          endpoint="/api/germplasm"
          entity="germplasm"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/germplasm" title="Thêm mẫu nguồn gen" fields={FIELDS} addLabel="Thêm nguồn gen" />}
          headers={["Số ĐK / nhóm", "Loài – tên địa phương", "Thu thập", "Lưu giữ", "Đánh giá", "Trạng thái"]}
          emptyText={query ? "Không có nguồn gen phù hợp" : "Chưa có nguồn gen nào"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.code,
            initial: x,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{x.code}</div>
                <div className="text-[11px] text-muted-foreground">{x.kind}</div>
              </div>,
              <div key="s">
                <div className="text-sm font-medium">{x.species}</div>
                <div className="text-[11px] text-muted-foreground">{x.localName || "—"}</div>
              </div>,
              <div key="t" className="text-xs">
                {x.collectionSite || "—"}
                <div className="text-muted-foreground">{fmtDateVN(x.collectedAt)}</div>
              </div>,
              <div key="l" className="text-xs">
                {x.conservation}
                {x.quantity && <div className="text-muted-foreground">{x.quantity}</div>}
              </div>,
              <span key="e" className="text-xs text-muted-foreground">{clip(x.evaluation || "—", 70)}</span>,
              <Badge key="st" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
