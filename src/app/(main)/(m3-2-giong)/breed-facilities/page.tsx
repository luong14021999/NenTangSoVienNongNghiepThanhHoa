import { Factory, Link2, MapPin, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import { FacilityMap } from "@/components/m3/facility-map";
import { productionLotStore } from "@/lib/modules/m3/data/breeding";
import { facilityStore } from "@/lib/modules/m3/data/genomics";
import { FACILITY_KINDS, FACILITY_STATUSES, INSPECTION_RESULTS } from "@/lib/modules/m3/genomics";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cơ sở sản xuất giống" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã cơ sở", required: true, mono: true, placeholder: "VD: CS-001" },
  { name: "kind", label: "Loại", type: "select", options: [...FACILITY_KINDS] },
  { name: "name", label: "Tên cơ sở", required: true, full: true },
  { name: "owner", label: "Chủ cơ sở / đơn vị quản lý" },
  { name: "district", label: "Huyện / thị xã / thành phố" },
  { name: "address", label: "Địa chỉ", full: true },
  { name: "latitude", label: "Vĩ độ (VD 19.807)", type: "number", nullable: true },
  { name: "longitude", label: "Kinh độ (VD 105.776)", type: "number", nullable: true },
  { name: "species", label: "Loài / giống sản xuất", full: true },
  { name: "scale", label: "Quy mô", placeholder: "VD: 5 ha, 200 con bố mẹ" },
  { name: "capacity", label: "Năng lực / năm", placeholder: "VD: 50 tấn hạt giống" },
  { name: "conditions", label: "Điều kiện sản xuất (nhà lưới, kho, thiết bị, nhân lực…)", type: "textarea" },
  { name: "inspectedAt", label: "Ngày kiểm tra gần nhất", type: "date" },
  { name: "inspectionResult", label: "Kết quả kiểm tra", type: "select", options: [...INSPECTION_RESULTS] },
  { name: "certificate", label: "Giấy chứng nhận đủ điều kiện", mono: true },
  { name: "status", label: "Tình trạng", type: "select", options: [...FACILITY_STATUSES] },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function BreedFacilitiesPage() {
  const [all, lots] = await Promise.all([facilityStore.list(), productionLotStore.list()]);
  const active = all.filter((f) => f.status === "Đang hoạt động");
  const points = all
    .filter((f) => f.latitude != null && f.longitude != null)
    .map((f) => ({ id: f.id, lat: f.latitude!, lng: f.longitude!, title: `${f.code} · ${f.name}`, subtitle: [f.kind, f.species, f.scale].filter(Boolean).join(" · "), kind: f.kind }));

  return (
    <>
      <Header title="Bản đồ cơ sở sản xuất giống" description="Cơ sở của Viện và cơ sở liên kết: địa điểm, quy mô, năng lực, điều kiện sản xuất, kết quả kiểm tra" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Cơ sở của Viện", value: active.filter((f) => f.kind === "Của Viện").length, icon: Factory, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Cơ sở liên kết", value: active.filter((f) => f.kind === "Liên kết").length, icon: Link2, accent: "bg-blue-50 text-blue-600" },
            { label: "Có tọa độ trên bản đồ", value: points.length, icon: MapPin, accent: "bg-violet-50 text-violet-600", hint: `/${all.length} cơ sở` },
            { label: "Đạt kiểm tra", value: active.filter((f) => f.inspectionResult === "Đạt").length, icon: ShieldCheck, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <Card>
          <CardHeader><CardTitle>Bản đồ</CardTitle><CardDescription>Nhập vĩ độ, kinh độ cho từng cơ sở (lấy từ Google Maps: nhấp chuột phải vào vị trí)</CardDescription></CardHeader>
          <CardContent><FacilityMap points={points} /></CardContent>
        </Card>
        <CrudTableCard
          title="Danh sách cơ sở"
          description="Lô sản xuất giống chọn cơ sở ở trang Sản xuất theo cấp"
          endpoint="/api/breed-facilities"
          entity="breed-facilities"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-facilities" title="Thêm cơ sở" fields={FIELDS} addLabel="Thêm cơ sở" />}
          headers={["Mã / loại", "Cơ sở", "Địa bàn", "Quy mô · năng lực", "Kiểm tra", "Lô sản xuất"]}
          emptyText="Chưa có cơ sở"
          rows={[...all].sort((a, b) => a.code.localeCompare(b.code)).map((f) => ({
            id: f.id,
            label: f.name,
            initial: f,
            cells: [
              <div key="c"><div className="font-mono text-xs font-semibold">{f.code}</div><Badge variant={f.kind === "Của Viện" ? "success" : "outline"}>{f.kind}</Badge></div>,
              <div key="n" className="max-w-[260px]"><div className="text-sm">{f.name}</div><div className="text-[11px] text-muted-foreground">{[f.owner, f.species].filter(Boolean).join(" · ")}</div></div>,
              <div key="d" className="text-xs">{f.district || "—"}<div className="text-muted-foreground">{f.latitude != null ? `${f.latitude}, ${f.longitude}` : "chưa có tọa độ"}</div></div>,
              <div key="s" className="text-xs">{f.scale || "—"}<div className="text-muted-foreground">{f.capacity}</div></div>,
              <div key="i" className="text-xs"><Badge variant={f.inspectionResult === "Đạt" ? "success" : f.inspectionResult === "Không đạt" ? "destructive" : "secondary"}>{f.inspectionResult}</Badge><div className="text-muted-foreground">{fmtDateVN(f.inspectedAt)}</div></div>,
              <span key="l" className="text-xs">{lots.filter((l) => l.facilityId === f.id).length}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
