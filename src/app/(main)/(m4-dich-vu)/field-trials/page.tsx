import { Sprout, Eye, Wheat, MapPin } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { fieldTrialStore, researchTaskStore } from "@/lib/modules/m4/data/research";
import { FIELD_TRIAL_STATUSES, TRIAL_DESIGNS } from "@/lib/modules/m4/research";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thí nghiệm đồng ruộng" };

/** Tọa độ đã nhập (0, 0 = chưa nhập). */
const hasGps = (lat: number, lng: number) => Boolean(lat || lng);

export default async function FieldTrialsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, tasks] = await Promise.all([fieldTrialStore.list(), researchTaskStore.list()]);
  const taskById = byId(tasks);
  const fields: CrudField[] = [
    { name: "code", label: "Mã thí nghiệm", required: true, mono: true, placeholder: "VD: TN-2026-001" },
    { name: "taskId", label: "Thuộc nhiệm vụ", type: "select", options: refOptions(tasks, (t) => `${t.code} · ${t.title}`) },
    { name: "title", label: "Tên thí nghiệm / khảo nghiệm", required: true, full: true },
    { name: "crop", label: "Cây trồng / vật nuôi" },
    { name: "design", label: "Kiểu bố trí", type: "select", options: [...TRIAL_DESIGNS] },
    { name: "treatments", label: "Số công thức", type: "number" },
    { name: "replications", label: "Số lần nhắc lại", type: "number" },
    { name: "plotAreaM2", label: "Diện tích ô (m²)", type: "number" },
    { name: "season", label: "Vụ", placeholder: "VD: Vụ Xuân 2026" },
    { name: "location", label: "Địa điểm", full: true },
    { name: "latitude", label: "Vĩ độ (VD 19.80)", type: "number" },
    { name: "longitude", label: "Kinh độ (VD 105.78)", type: "number" },
    { name: "startAt", label: "Bắt đầu", type: "date" },
    { name: "endAt", label: "Kết thúc", type: "date" },
    { name: "lead", label: "Người phụ trách" },
    { name: "status", label: "Trạng thái", type: "select", options: [...FIELD_TRIAL_STATUSES] },
    { name: "results", label: "Kết quả chính", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => b.code.localeCompare(a.code)).filter((x) => matches(query, x.code, x.title, x.crop, x.location, x.season, taskById.get(x.taskId)?.code));
  const count = (s: string) => all.filter((x) => x.status === s).length;

  return (
    <>
      <Header title="Thí nghiệm, khảo nghiệm đồng ruộng" description="Bố trí thí nghiệm (công thức × nhắc lại), địa điểm, theo dõi và kết quả – gắn với nhiệm vụ KH&CN" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Thí nghiệm", value: all.length, icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Đang theo dõi", value: count("Đang bố trí") + count("Đang theo dõi"), icon: Eye, accent: "bg-blue-50 text-blue-600" },
            { label: "Đã thu hoạch / xử lý", value: count("Đã thu hoạch") + count("Đã xử lý số liệu"), icon: Wheat, accent: "bg-amber-50 text-amber-600" },
            { label: "Ô thí nghiệm", value: all.reduce((s, x) => s + (x.treatments || 0) * (x.replications || 0), 0).toLocaleString("vi-VN"), icon: MapPin, accent: "bg-violet-50 text-violet-600", hint: "công thức × nhắc lại" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/field-trials" placeholder="Tìm mã, tên, cây trồng, địa điểm, vụ…" />
        </div>
        <CrudTableCard
          title="Danh sách thí nghiệm"
          description="Khảo nghiệm giống (VCU, DUS) quản lý ở M3.2 – Khảo nghiệm; ở đây là thí nghiệm của nhiệm vụ nghiên cứu"
          endpoint="/api/field-trials"
          entity="field-trials"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/field-trials" title="Thêm thí nghiệm" fields={fields} addLabel="Thêm thí nghiệm" />}
          headers={["Mã / nhiệm vụ", "Thí nghiệm", "Bố trí", "Địa điểm · vụ", "Kết quả", "Trạng thái"]}
          emptyText={query ? "Không có thí nghiệm phù hợp" : "Chưa có thí nghiệm nào"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.code,
            initial: x,
            cells: [
              <div key="c"><div className="font-mono text-xs font-semibold">{x.code}</div><div className="text-[11px] text-muted-foreground font-mono">{taskById.get(x.taskId)?.code ?? "—"}</div></div>,
              <div key="t" className="max-w-[280px]"><div className="text-sm">{x.title}</div><div className="text-[11px] text-muted-foreground">{x.crop}</div></div>,
              <div key="d" className="text-xs">{x.treatments} CT × {x.replications} lần<div className="text-muted-foreground">{x.design}{x.plotAreaM2 ? ` · ô ${x.plotAreaM2} m²` : ""}</div></div>,
              <div key="l" className="text-xs max-w-[220px]">
                {x.location || "—"}
                {hasGps(x.latitude, x.longitude) && (
                  <div><a href={`https://www.openstreetmap.org/?mlat=${x.latitude}&mlon=${x.longitude}#map=16/${x.latitude}/${x.longitude}`} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">{x.latitude}, {x.longitude}</a></div>
                )}
                <div className="text-muted-foreground">{x.season} {x.startAt && `· ${fmtDateVN(x.startAt)} → ${fmtDateVN(x.endAt) || "…"}`}</div>
              </div>,
              <span key="r" className="text-xs">{clip(x.results || "—", 80)}</span>,
              <Badge key="s" variant={x.status === "Hủy" ? "destructive" : x.status === "Đã xử lý số liệu" ? "success" : "secondary"}>{x.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
