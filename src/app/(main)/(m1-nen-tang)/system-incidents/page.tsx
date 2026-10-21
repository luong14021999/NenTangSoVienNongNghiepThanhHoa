import { ServerCrash, Wrench, CheckCircle2, DatabaseZap } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { INCIDENT_CATEGORIES, INCIDENT_STATUSES, incidentStore, type SystemIncident } from "@/lib/modules/m2/data/incidents";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sổ sự cố hệ thống" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã sự cố", required: true, mono: true, placeholder: "VD: SC-2026-01" },
  { name: "occurredAt", label: "Ngày xảy ra", type: "date", defaultValue: todayISO() },
  { name: "category", label: "Loại", type: "select", options: [...INCIDENT_CATEGORIES] },
  { name: "detectedBy", label: "Người phát hiện" },
  { name: "description", label: "Mô tả sự cố / sai lỗi", type: "textarea", required: true },
  { name: "impact", label: "Dữ liệu / kết quả bị ảnh hưởng", type: "textarea" },
  { name: "action", label: "Biện pháp khắc phục, khôi phục dữ liệu", type: "textarea" },
  { name: "status", label: "Trạng thái", type: "select", options: [...INCIDENT_STATUSES] },
  { name: "closedAt", label: "Ngày khắc phục xong", type: "date" },
  { name: "ncCode", label: "Mã CAPA liên quan (nếu có)", mono: true },
];

const statusVariant: Record<SystemIncident["status"], "destructive" | "warning" | "success"> = {
  "Mở": "destructive",
  "Đang xử lý": "warning",
  "Đã khắc phục": "success",
};

export default async function SystemIncidentsPage() {
  const all = (await incidentStore.list()).sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));
  const open = all.filter((i) => i.status !== "Đã khắc phục");
  return (
    <>
      <Header
        title="Sổ sự cố hệ thống thông tin"
        description="ISO/IEC 17025:2017 §7.11.3 – ghi nhận sự cố, sai lỗi của hệ thống quản lý thông tin, ảnh hưởng đến dữ liệu và hành động khắc phục"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tổng sự cố", value: all.length, icon: ServerCrash, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang mở / xử lý", value: open.length, icon: Wrench, accent: "bg-rose-50 text-rose-600" },
            { label: "Ảnh hưởng dữ liệu", value: all.filter((i) => i.category === "Mất / sai dữ liệu" || i.impact.trim()).length, icon: DatabaseZap, accent: "bg-amber-50 text-amber-600" },
            { label: "Đã khắc phục", value: all.length - open.length, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
          ]}
        />
        <CrudTableCard
          title="Sự cố đã ghi nhận"
          description="Sự cố ảnh hưởng đến kết quả đã phát hành cần ghi thêm vào sổ Không phù hợp & CAPA (§7.10)"
          endpoint="/api/system-incidents"
          entity="system-incidents"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/system-incidents" title="Ghi nhận sự cố hệ thống" fields={FIELDS} addLabel="Ghi nhận sự cố" />}
          headers={["Mã / ngày", "Loại", "Mô tả", "Ảnh hưởng", "Khắc phục", "Trạng thái"]}
          emptyText="Chưa có sự cố nào được ghi nhận"
          rows={all.map((i) => ({
            id: i.id,
            label: i.code,
            initial: i,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{i.code}</div>
                <div className="text-[11px] text-muted-foreground">{fmtDateVN(i.occurredAt)} · {i.detectedBy}</div>
              </div>,
              <span key="k" className="text-xs">{i.category}</span>,
              <span key="d" className="text-sm max-w-[300px] inline-block leading-snug">{clip(i.description)}</span>,
              <span key="i" className="text-xs max-w-[200px] inline-block">{clip(i.impact || "—", 80)}</span>,
              <span key="a" className="text-xs max-w-[200px] inline-block">{clip(i.action || "—", 80)}</span>,
              <Badge key="s" variant={statusVariant[i.status] ?? "secondary"}>{i.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
