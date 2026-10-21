import Link from "next/link";
import { Send } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { ActionButton } from "@/components/platform/action-button";
import { varietyStore } from "@/lib/modules/m3/data/breeding";
import { distributionStore } from "@/lib/modules/m3/data/genomics";
import { channelMode } from "@/lib/platform/integration/lgsp";
import { currentAccess } from "@/lib/platform/data/access";
import { byId, refOptions } from "@/lib/platform/ref-options";
import { todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phân bố giống" };

/** Phân bố giống theo địa bàn (M3.2.7) và gửi chỉ tiêu về giống cho Sở NN&MT / IOC tỉnh qua M1. */
export default async function BreedDistributionsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const thisYear = Number(todayISO().slice(0, 4));
  const year = Math.min(thisYear + 1, Math.max(2000, Number((await searchParams).year) || thisYear));
  const [all, varieties, access] = await Promise.all([distributionStore.list(), varietyStore.list(), currentAccess()]);
  const varietyById = byId(varieties);
  const rows = all.filter((d) => d.year === year);
  const districts = [...new Set(rows.map((d) => d.district))].sort((a, b) => a.localeCompare(b, "vi"));
  const vIds = [...new Set(rows.map((d) => d.varietyId))];
  const cell = new Map(rows.map((d) => [`${d.district}|${d.varietyId}`, d]));
  const fields: CrudField[] = [
    { name: "varietyId", label: "Giống", type: "select", required: true, options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "district", label: "Huyện / thị xã / thành phố", required: true },
    { name: "year", label: "Năm", type: "number", defaultValue: year },
    { name: "areaHa", label: "Diện tích / quy mô", type: "number" },
    { name: "unit", label: "Đơn vị", type: "select", options: ["ha", "nghìn con", "tấn"] },
    { name: "source", label: "Nguồn số liệu", placeholder: "Phòng NN huyện, Cục Thống kê…" },
  ];

  return (
    <>
      <Header title="Phân bố giống trên địa bàn" description="Diện tích / quy mô các giống theo huyện – chỉ tiêu về giống cung cấp cho Sở NN&MT, IOC tỉnh qua M1" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="flex flex-wrap items-center gap-2">
          {[thisYear - 2, thisYear - 1, thisYear].map((y) => (
            <Link key={y} href={`/breed-distributions?year=${y}`} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${y === year ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>Năm {y}</Link>
          ))}
          {access.can("write.breeding") && (
            <div className="ml-auto">
              <ActionButton
                url="/api/m3-reports/breed-indicators/send"
                body={{ year }}
                label={`Gửi chỉ tiêu ${year} cho Sở NN&MT / IOC${channelMode("LGSP") === "Mô phỏng" ? " (mô phỏng)" : ""}`}
                icon={<Send />}
                confirm={`Gửi chỉ tiêu về giống năm ${year} (giống công nhận / lưu hành, sản xuất theo cấp, cơ sở sản xuất, phân bố giống – không có dữ liệu khách hàng, giá) qua LGSP?`}
                success="Đã gửi – xem nhật ký ở trang Tích hợp (M1)"
              />
            </div>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Bảng phân bố năm {year}</CardTitle>
            <CardDescription>IOC có thể tự lấy số liệu qua <span className="font-mono">GET /api/v1/m3/breed-indicators?year={year}</span> bằng khóa API phạm vi <span className="font-mono">breed:read</span></CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có số liệu năm {year}</p>
            ) : (
              <table className="text-xs w-full">
                <thead className="bg-muted/40"><tr><th className="text-left font-medium px-2 py-1.5">Huyện</th>{vIds.map((v) => <th key={v} className="text-right font-medium px-2 py-1.5">{varietyById.get(v)?.name ?? "—"}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {districts.map((d) => (
                    <tr key={d}>
                      <td className="px-2 py-1">{d}</td>
                      {vIds.map((v) => {
                        const c = cell.get(`${d}|${v}`);
                        return <td key={v} className="px-2 py-1 text-right tabular-nums">{c ? `${c.areaHa.toLocaleString("vi-VN")} ${c.unit}` : ""}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <CrudTableCard
          title="Số liệu phân bố"
          description="Trùng giống – huyện – năm – đơn vị sẽ bị từ chối; sửa dòng đã có"
          endpoint="/api/breed-distributions"
          entity="breed-distributions"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-distributions" title="Thêm số liệu" fields={fields} addLabel="Thêm số liệu" />}
          headers={["Năm", "Huyện", "Giống", "Diện tích / quy mô", "Nguồn"]}
          emptyText="Chưa có số liệu"
          rows={[...all].sort((a, b) => b.year - a.year || a.district.localeCompare(b.district, "vi")).slice(0, 300).map((d) => ({
            id: d.id,
            label: `${d.district} ${d.year}`,
            initial: d,
            cells: [
              <span key="y" className="text-xs">{d.year}</span>,
              <span key="d" className="text-sm">{d.district}</span>,
              <span key="v" className="text-xs">{varietyById.get(d.varietyId)?.name ?? "—"}</span>,
              <span key="a" className="text-sm tabular-nums">{d.areaHa.toLocaleString("vi-VN")} {d.unit}</span>,
              <span key="s" className="text-xs text-muted-foreground">{d.source || "—"}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
