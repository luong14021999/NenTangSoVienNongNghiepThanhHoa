import { Header } from "@/components/layout/header";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { productionProfileStore } from "@/lib/modules/m3/data/tissue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thông số sản xuất" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: TS-CHUOI-01" },
  { name: "species", label: "Loài", required: true },
  { name: "variety", label: "Giống", full: true },
  { name: "multiplicationRate", label: "Hệ số nhân mỗi lần cấy chuyển", type: "number", defaultValue: 3 },
  { name: "cycleDays", label: "Chu kỳ cấy chuyển (ngày)", type: "number", defaultValue: 30 },
  { name: "rootingDays", label: "Giai đoạn ra rễ (ngày)", type: "number", defaultValue: 30 },
  { name: "nurseryDays", label: "Ra ngôi → đủ tiêu chuẩn xuất (ngày)", type: "number", defaultValue: 45 },
  { name: "invitroSurvival", label: "Tỷ lệ sống in vitro (%)", type: "number", defaultValue: 90 },
  { name: "nurserySurvival", label: "Tỷ lệ sống vườn ươm (%)", type: "number", defaultValue: 85 },
  { name: "grade1Share", label: "Tỷ lệ cây Loại 1 trong số sống (%)", type: "number", defaultValue: 80 },
  { name: "note", label: "Ghi chú (nguồn số liệu, mùa vụ…)", type: "textarea" },
];

export default async function ProductionProfilesPage() {
  const all = (await productionProfileStore.list()).sort((a, b) => a.species.localeCompare(b.species, "vi"));
  return (
    <>
      <Header title="Thông số sản xuất theo giống" description="Hệ số nhân, chu kỳ, thời gian ra rễ – vườn ươm, tỷ lệ sống: căn cứ lập kế hoạch tính ngược cho đơn hàng" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <CrudTableCard
          title="Thông số kỹ thuật"
          description="Nên cập nhật theo số liệu thực tế: hệ số nhân và tỷ lệ sống trung bình xem ở trang Mẻ cấy, Thống kê tỷ lệ nhiễm"
          endpoint="/api/production-profiles"
          entity="production-profiles"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/production-profiles" title="Thêm thông số" fields={FIELDS} addLabel="Thêm thông số" />}
          headers={["Mã", "Loài – giống", "Hệ số nhân · chu kỳ", "Ra rễ · vườn ươm", "Tỷ lệ sống", "Loại 1"]}
          emptyText="Chưa có thông số – cần ít nhất một bộ để lập kế hoạch đơn hàng"
          rows={all.map((p) => ({
            id: p.id,
            label: p.code,
            initial: p,
            cells: [
              <span key="c" className="font-mono text-xs font-semibold">{p.code}</span>,
              <div key="s"><div className="text-sm">{p.species}</div><div className="text-[11px] text-muted-foreground">{p.variety || "—"}</div></div>,
              <span key="m" className="text-xs">× {p.multiplicationRate} · {p.cycleDays} ngày</span>,
              <span key="r" className="text-xs">{p.rootingDays} ngày · {p.nurseryDays} ngày</span>,
              <span key="v" className="text-xs">in vitro {p.invitroSurvival}% · vườn {p.nurserySurvival}%</span>,
              <span key="g" className="text-xs">{p.grade1Share}%</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
