import { FlaskConicalOff, Sprout, TestTube, PauseCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { BASE_MEDIA, CULTURE_STAGES, RECIPE_STATUSES, mediaRecipeStore, type MediaRecipe } from "@/lib/modules/m3/data/tissue";
import { matches } from "@/lib/platform/ref-options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Công thức môi trường" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã công thức", required: true, mono: true, placeholder: "VD: MT-NN-01" },
  { name: "name", label: "Tên công thức", required: true },
  { name: "stage", label: "Giai đoạn", type: "select", options: [...CULTURE_STAGES] },
  { name: "baseMedium", label: "Môi trường nền", type: "select", options: [...BASE_MEDIA] },
  { name: "hormones", label: "Chất điều hòa sinh trưởng", full: true, placeholder: "VD: BAP 2 mg/l + NAA 0,5 mg/l" },
  { name: "sugarGl", label: "Đường (g/l)", type: "number", defaultValue: 30 },
  { name: "agarGl", label: "Agar (g/l)", type: "number", defaultValue: 7 },
  { name: "ph", label: "pH", type: "number", defaultValue: 5.8 },
  { name: "status", label: "Trạng thái", type: "select", options: [...RECIPE_STATUSES] },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const statusVariant: Record<MediaRecipe["status"], "success" | "warning" | "secondary"> = {
  "Đang dùng": "success",
  "Thử nghiệm": "warning",
  "Ngừng dùng": "secondary",
};

export default async function MediaRecipesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const all = (await mediaRecipeStore.list()).sort((a, b) => a.code.localeCompare(b.code));
  const query = q.trim().toLowerCase();
  const rows = all.filter((x) => matches(query, x.code, x.name, x.hormones, x.stage));

  return (
    <>
      <Header title="Công thức môi trường" description="Môi trường nuôi cấy theo giai đoạn: nền, chất điều hòa sinh trưởng, đường, agar, pH" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Công thức", value: all.length, icon: FlaskConicalOff, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang dùng", value: all.filter((x) => x.status === "Đang dùng").length, icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Thử nghiệm", value: all.filter((x) => x.status === "Thử nghiệm").length, icon: TestTube, accent: "bg-amber-50 text-amber-600" },
            { label: "Ngừng dùng", value: all.filter((x) => x.status === "Ngừng dùng").length, icon: PauseCircle, accent: "bg-slate-100 text-slate-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/media-recipes" placeholder="Tìm mã, tên, chất điều hòa…" />
        </div>
        <CrudTableCard
          title="Danh sách công thức"
          description="Mỗi mẻ cấy ghi rõ công thức đã dùng để truy xuất"
          endpoint="/api/media-recipes"
          entity="media-recipes"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/media-recipes" title="Thêm công thức" fields={FIELDS} addLabel="Thêm công thức" />}
          headers={["Mã", "Tên / giai đoạn", "Nền", "Chất điều hòa", "Đường · agar · pH", "Trạng thái"]}
          emptyText={query ? "Không có công thức phù hợp" : "Chưa có công thức nào"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.code,
            initial: x,
            cells: [
              <span key="c" className="font-mono text-xs font-semibold">{x.code}</span>,
              <div key="n">
                <div className="text-sm font-medium">{x.name}</div>
                <div className="text-[11px] text-muted-foreground">{x.stage}</div>
              </div>,
              <span key="b" className="text-sm">{x.baseMedium}</span>,
              <span key="h" className="text-xs">{x.hormones || "—"}</span>,
              <span key="p" className="text-xs whitespace-nowrap">{x.sugarGl} g/l · {x.agarGl} g/l · pH {x.ph}</span>,
              <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
