import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { genotypeCallStore, markerStore } from "@/lib/modules/m3/data/genomics";
import { MARKER_KINDS } from "@/lib/modules/m3/genomics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chỉ thị phân tử" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã chỉ thị", required: true, mono: true, placeholder: "VD: RM190, SNP_07, ITS2" },
  { name: "kind", label: "Loại", type: "select", options: [...MARKER_KINDS] },
  { name: "name", label: "Tên / mô tả", full: true },
  { name: "locus", label: "Nhiễm sắc thể / vị trí" },
  { name: "alleles", label: "Alen đã biết", placeholder: "VD: 110, 118, 124 bp" },
  { name: "primers", label: "Mồi / vị trí SNP", type: "textarea" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function MarkersPage() {
  const [all, calls] = await Promise.all([markerStore.list(), genotypeCallStore.list()]);
  return (
    <>
      <Header title="Chỉ thị phân tử" description="Danh mục chỉ thị SSR, SNP, mã vạch ADN dùng nhận dạng giống và giám định độ thuần" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <CrudTableCard
          title="Danh mục chỉ thị"
          description="Mã chỉ thị dùng khi dán kiểu gen từ Excel ở trang Mẫu ADN & kiểu gen"
          endpoint="/api/markers"
          entity="markers"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/markers" title="Thêm chỉ thị" fields={FIELDS} addLabel="Thêm chỉ thị" />}
          headers={["Mã", "Loại", "Tên · vị trí", "Alen", "Số kiểu gen"]}
          emptyText="Chưa có chỉ thị"
          rows={[...all].sort((a, b) => a.code.localeCompare(b.code)).map((m) => ({
            id: m.id,
            label: m.code,
            initial: m,
            cells: [
              <span key="c" className="font-mono text-xs font-semibold">{m.code}</span>,
              <Badge key="k" variant="outline">{m.kind}</Badge>,
              <div key="n" className="text-xs">{m.name || "—"}<div className="text-muted-foreground">{m.locus}</div></div>,
              <span key="a" className="text-xs">{m.alleles || "—"}</span>,
              <span key="g" className="text-xs">{calls.filter((c) => c.markerId === m.id).length}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
