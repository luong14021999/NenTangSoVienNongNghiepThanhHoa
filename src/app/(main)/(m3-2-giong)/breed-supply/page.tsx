import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { breedDemandStore, productionLotStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { QTY_UNITS, demandVsSupply } from "@/lib/modules/m3/breeding-rules";
import { byId, refOptions } from "@/lib/platform/ref-options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nhu cầu & cung ứng giống" };

/** Nhu cầu giống theo địa phương, mùa vụ – so với sản lượng kế hoạch / thực tế của Viện (M3.2.6). */
export default async function BreedSupplyPage() {
  const [demands, lots, varieties] = await Promise.all([breedDemandStore.list(), productionLotStore.list(), varietyStore.list()]);
  const varietyById = byId(varieties);
  const fields: CrudField[] = [
    { name: "area", label: "Địa phương (huyện / xã / HTX)", required: true },
    { name: "season", label: "Mùa vụ", required: true, placeholder: "VD: Vụ Xuân 2027" },
    { name: "varietyId", label: "Giống", type: "select", options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "species", label: "Loài (nếu chưa xác định giống)" },
    { name: "quantity", label: "Số lượng cần", type: "number", required: true },
    { name: "unit", label: "Đơn vị", type: "select", options: [...QTY_UNITS] },
    { name: "source", label: "Nguồn thông tin", placeholder: "Sở NN&MT, đăng ký HTX, khảo sát…" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const balance = demandVsSupply(demands, lots).sort((a, b) => a.gap - b.gap);

  return (
    <>
      <Header title="Nhu cầu & cung ứng giống" description="Nhu cầu theo địa phương, mùa vụ so với sản lượng giống Viện kế hoạch / thực tế" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Card>
          <CardHeader>
            <CardTitle>Cân đối cung – cầu theo giống và mùa vụ</CardTitle>
            <CardDescription>Cung = max(kế hoạch, thực tế) của các lô sản xuất cùng giống – mùa vụ – đơn vị; thiếu được xếp lên đầu</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr><th className="text-left font-medium py-1">Giống</th><th className="text-left font-medium">Mùa vụ</th><th className="text-right font-medium">Nhu cầu</th><th className="text-right font-medium">Kế hoạch</th><th className="text-right font-medium">Thực tế</th><th className="text-right font-medium">Chênh lệch</th></tr></thead>
              <tbody className="divide-y">
                {balance.map((b) => (
                  <tr key={`${b.varietyId}-${b.season}-${b.unit}`}>
                    <td className="py-1.5">{varietyById.get(b.varietyId)?.name ?? "Chưa xác định giống"}</td>
                    <td>{b.season}</td>
                    <td className="text-right tabular-nums">{b.demand.toLocaleString("vi-VN")} {b.unit}</td>
                    <td className="text-right tabular-nums">{b.planned.toLocaleString("vi-VN")}</td>
                    <td className="text-right tabular-nums">{b.actual.toLocaleString("vi-VN")}</td>
                    <td className={`text-right tabular-nums font-medium ${b.gap < 0 ? "text-rose-600" : "text-emerald-700"}`}>{b.gap > 0 ? "+" : ""}{b.gap.toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
                {balance.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted-foreground text-xs">Chưa có dữ liệu nhu cầu hoặc sản xuất</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <CrudTableCard
          title="Nhu cầu theo địa phương"
          description="Ghi mùa vụ cùng cách viết với lô sản xuất để cân đối đúng (không phân biệt dấu, hoa thường)"
          endpoint="/api/breed-demands"
          entity="breed-demands"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-demands" title="Thêm nhu cầu" fields={fields} addLabel="Thêm nhu cầu" />}
          headers={["Địa phương", "Mùa vụ", "Giống", "Số lượng", "Nguồn"]}
          emptyText="Chưa có nhu cầu"
          rows={[...demands].sort((a, b) => a.season.localeCompare(b.season) || a.area.localeCompare(b.area, "vi")).map((d) => ({
            id: d.id,
            label: `${d.area} ${d.season}`,
            initial: d,
            cells: [
              <span key="a" className="text-sm">{d.area}</span>,
              <span key="s" className="text-xs">{d.season}</span>,
              <span key="v" className="text-xs">{varietyById.get(d.varietyId)?.name ?? d.species ?? "—"}</span>,
              <span key="q" className="text-sm tabular-nums">{d.quantity.toLocaleString("vi-VN")} {d.unit}</span>,
              <span key="n" className="text-xs text-muted-foreground">{d.source || "—"}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
