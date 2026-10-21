import { TreeDeciduous, ShieldCheck, ShieldAlert, HelpCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { motherPlantStore, tissueMaterialStore } from "@/lib/modules/m3/data/tissue";
import { germplasmStore } from "@/lib/modules/m3/data/breeding";
import { DISEASE_METHODS, DISEASE_STATUSES, MOTHER_STATUSES } from "@/lib/modules/m3/tissue-rules";
import { diseaseVariant } from "@/lib/modules/m3/ui";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cây mẹ & nguồn giống" };

export default async function MotherPlantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, germplasm, materials] = await Promise.all([motherPlantStore.list(), germplasmStore.list(), tissueMaterialStore.list()]);
  const germplasmById = byId(germplasm);
  const fields: CrudField[] = [
    { name: "code", label: "Mã cây mẹ", required: true, mono: true, placeholder: "VD: CM-001" },
    { name: "species", label: "Loài", required: true },
    { name: "variety", label: "Giống" },
    { name: "germplasmId", label: "Mã nguồn gen (M3.2)", type: "select", options: refOptions(germplasm, (g) => `${g.code} · ${g.species} ${g.localName}`.trim()) },
    { name: "origin", label: "Nguồn gốc", placeholder: "VD: vườn đầu dòng, nhập nội…" },
    { name: "location", label: "Nơi lưu giữ (vườn / nhà lưới)" },
    { name: "plantedAt", label: "Ngày trồng / tiếp nhận", type: "date" },
    { name: "status", label: "Tình trạng sử dụng", type: "select", options: [...MOTHER_STATUSES] },
    { name: "selectionCriteria", label: "Tiêu chí chọn cây mẹ", type: "textarea" },
    { name: "diseaseStatus", label: "Kết quả kiểm tra sạch bệnh", type: "select", options: [...DISEASE_STATUSES] },
    { name: "diseaseTestedAt", label: "Ngày kiểm tra", type: "date" },
    { name: "diseaseMethod", label: "Phương pháp", type: "select", options: ["", ...DISEASE_METHODS] },
    { name: "pathogens", label: "Tác nhân đã kiểm tra", placeholder: "VD: BBTV, CMV" },
    { name: "diseaseRef", label: "Mã mẫu M2 / số phiếu kết quả", mono: true, full: true },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => a.code.localeCompare(b.code)).filter((x) => matches(query, x.code, x.species, x.variety, x.origin, x.location));
  const count = (s: string) => all.filter((x) => x.diseaseStatus === s).length;

  return (
    <>
      <Header title="Cây mẹ & hồ sơ nguồn giống" description="Nguồn gốc, mã nguồn gen, kết quả kiểm tra sạch bệnh – điểm đầu của chuỗi truy xuất cây giống nuôi cấy mô" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Cây mẹ", value: all.length, icon: TreeDeciduous, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Sạch bệnh", value: count("Sạch bệnh"), icon: ShieldCheck, accent: "bg-blue-50 text-blue-600" },
            { label: "Chưa kiểm tra", value: count("Chưa kiểm tra"), icon: HelpCircle, accent: "bg-amber-50 text-amber-600" },
            { label: "Nhiễm bệnh", value: count("Nhiễm bệnh"), icon: ShieldAlert, accent: "bg-rose-50 text-rose-600", hint: "không dùng làm vật liệu" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/mother-plants" placeholder="Tìm mã, loài, giống, nguồn gốc, nơi lưu giữ…" />
        </div>
        <CrudTableCard
          title="Danh sách cây mẹ"
          description="Cây mẹ có kết quả Nhiễm bệnh bị chặn khi tạo vật liệu khởi đầu"
          endpoint="/api/mother-plants"
          entity="mother-plants"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/mother-plants" title="Thêm cây mẹ" fields={fields} addLabel="Thêm cây mẹ" />}
          headers={["Mã", "Loài – giống", "Nguồn gen · nguồn gốc", "Sạch bệnh", "Vật liệu", "Tình trạng"]}
          emptyText={query ? "Không có cây mẹ phù hợp" : "Chưa có cây mẹ nào"}
          rows={rows.map((x) => {
            const g = germplasmById.get(x.germplasmId);
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <span key="c" className="font-mono text-xs font-semibold">{x.code}</span>,
                <div key="s"><div className="text-sm font-medium">{x.species}</div><div className="text-[11px] text-muted-foreground">{x.variety || "—"}</div></div>,
                <div key="g" className="text-xs max-w-[220px]">
                  {g ? <span className="font-mono">{g.code}</span> : <span className="text-muted-foreground">chưa gắn nguồn gen</span>}
                  <div className="text-muted-foreground">{clip([x.origin, x.location].filter(Boolean).join(" · "), 60)}</div>
                </div>,
                <div key="d" className="text-xs">
                  <Badge variant={diseaseVariant[x.diseaseStatus] ?? "secondary"}>{x.diseaseStatus}</Badge>
                  {x.diseaseTestedAt && <div className="text-muted-foreground mt-0.5">{[x.diseaseMethod, fmtDateVN(x.diseaseTestedAt)].filter(Boolean).join(" · ")}</div>}
                  {x.pathogens && <div className="text-muted-foreground">{x.pathogens}</div>}
                </div>,
                <span key="m" className="text-xs">{materials.filter((m) => m.motherPlantId === x.id).length}</span>,
                <Badge key="st" variant={x.status === "Đang sử dụng" ? "outline" : "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
