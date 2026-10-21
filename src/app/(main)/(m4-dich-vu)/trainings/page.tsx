import { Presentation, MonitorPlay, Users, CalendarClock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { StatGrid } from "@/components/common/stat-grid";
import { techTransferStore, trainingStore } from "@/lib/modules/m4/data/knowledge";
import { safeUrl } from "@/lib/modules/m4/data/portal";
import { TRAINING_MODES, TRAINING_STATUSES } from "@/lib/modules/m4/knowledge";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tập huấn" };

export default async function TrainingsPage() {
  const [all, transfers] = await Promise.all([trainingStore.list(), techTransferStore.list()]);
  const transferById = byId(transfers);
  const today = todayISO();
  const fields: CrudField[] = [
    { name: "code", label: "Mã lớp", required: true, mono: true, placeholder: "VD: TH-2026-001" },
    { name: "mode", label: "Hình thức", type: "select", options: [...TRAINING_MODES] },
    { name: "title", label: "Tên lớp tập huấn", required: true, full: true },
    { name: "transferId", label: "Thuộc chuyển giao", type: "select", options: refOptions(transfers, (t) => `${t.code} · ${t.title}`) },
    { name: "audience", label: "Đối tượng", placeholder: "Nông dân, cán bộ khuyến nông…" },
    { name: "startAt", label: "Bắt đầu", type: "date" },
    { name: "endAt", label: "Kết thúc", type: "date" },
    { name: "trainer", label: "Giảng viên" },
    { name: "venue", label: "Địa điểm / nền tảng trực tuyến", full: true },
    { name: "equipment", label: "Thiết bị sử dụng (Khoản mục I.2)", full: true, placeholder: "VD: Phòng họp trực tuyến, màn hình tương tác, camera hội nghị" },
    { name: "meetingUrl", label: "Đường dẫn phòng học trực tuyến (https://…)", full: true },
    { name: "materialsUrl", label: "Tài liệu tập huấn (https://…)", full: true },
    { name: "planned", label: "Học viên dự kiến", type: "number" },
    { name: "attended", label: "Học viên tham dự", type: "number" },
    { name: "status", label: "Tình trạng", type: "select", options: [...TRAINING_STATUSES] },
    { name: "note", label: "Ghi chú, đánh giá", type: "textarea" },
  ];
  const year = today.slice(0, 4);
  const held = all.filter((x) => x.status === "Đã tổ chức");
  const upcoming = all.filter((x) => (x.status === "Kế hoạch" || x.status === "Đang mở đăng ký") && x.startAt && x.startAt >= today);

  return (
    <>
      <Header title="Tập huấn" description="Lớp tập huấn chuyển giao tiến bộ KH&CN – trực tuyến trên thiết bị tại Khoản mục I.2, trực tiếp hoặc kết hợp" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: `Lớp đã tổ chức ${year}`, value: held.filter((x) => (x.startAt || "").startsWith(year)).length, icon: Presentation, accent: "bg-blue-50 text-blue-600" },
            { label: "Trực tuyến / kết hợp", value: all.filter((x) => x.mode !== "Trực tiếp").length, icon: MonitorPlay, accent: "bg-violet-50 text-violet-600" },
            { label: `Học viên ${year}`, value: held.filter((x) => (x.startAt || "").startsWith(year)).reduce((s, x) => s + (x.attended || 0), 0).toLocaleString("vi-VN"), icon: Users, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Lớp sắp diễn ra", value: upcoming.length, icon: CalendarClock, accent: "bg-amber-50 text-amber-600" },
          ]}
        />
        <CrudTableCard
          title="Danh sách lớp tập huấn"
          endpoint="/api/trainings"
          entity="trainings"
          description="Ghi số học viên tham dự sau khi tổ chức để thống kê"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/trainings" title="Thêm lớp tập huấn" fields={fields} addLabel="Thêm lớp" />}
          headers={["Mã / hình thức", "Lớp", "Thời gian", "Địa điểm · thiết bị", "Học viên", "Tình trạng"]}
          emptyText="Chưa có lớp tập huấn"
          rows={[...all].sort((a, b) => (b.startAt || "").localeCompare(a.startAt || "")).map((x) => {
            const meeting = safeUrl(x.meetingUrl);
            const materials = safeUrl(x.materialsUrl);
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c"><div className="font-mono text-xs font-semibold">{x.code}</div><div className="text-[11px] text-muted-foreground">{x.mode}</div></div>,
                <div key="t" className="max-w-[280px]">
                  <div className="text-sm">{x.title}</div>
                  <div className="text-[11px] text-muted-foreground">{[x.audience, x.trainer, transferById.get(x.transferId)?.code].filter(Boolean).join(" · ")}</div>
                </div>,
                <span key="d" className="text-xs whitespace-nowrap">{fmtDateVN(x.startAt) || "—"}{x.endAt && x.endAt !== x.startAt ? ` → ${fmtDateVN(x.endAt)}` : ""}</span>,
                <div key="v" className="text-xs max-w-[220px]">
                  {x.venue || "—"}
                  {x.equipment && <div className="text-muted-foreground">{x.equipment}</div>}
                  <div className="flex gap-2">
                    {meeting && <a href={meeting} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Phòng học</a>}
                    {materials && <a href={materials} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">Tài liệu</a>}
                  </div>
                </div>,
                <span key="n" className="text-xs whitespace-nowrap">{x.attended || 0}/{x.planned || 0}</span>,
                <Badge key="s" variant={x.status === "Đã tổ chức" ? "success" : x.status === "Hủy" ? "destructive" : "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
