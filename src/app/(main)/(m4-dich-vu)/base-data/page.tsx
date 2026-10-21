import Link from "next/link";
import { Database, Mountain, CloudRain, Waves, Wheat, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { baseDatasetStore, countObservations } from "@/lib/modules/m4/data/knowledge";
import { BASE_THEMES, UPDATE_FREQUENCIES } from "@/lib/modules/m4/knowledge";
import { clip } from "@/components/common/stat-grid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dữ liệu nền" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã bộ dữ liệu", required: true, mono: true, placeholder: "VD: DLN-KH-01" },
  { name: "theme", label: "Chủ đề", type: "select", options: [...BASE_THEMES] },
  { name: "title", label: "Tên bộ dữ liệu", required: true, full: true, placeholder: "VD: Lượng mưa tháng các trạm khí tượng" },
  { name: "area", label: "Địa bàn" },
  { name: "period", label: "Thời kỳ", placeholder: "VD: 2015–2025" },
  { name: "source", label: "Nguồn", placeholder: "VD: Đài KTTV Thanh Hóa, Cục Thống kê" },
  { name: "updateFrequency", label: "Tần suất cập nhật", type: "select", options: [...UPDATE_FREQUENCIES] },
  { name: "url", label: "Đường dẫn nguồn (https://…)", full: true },
  { name: "description", label: "Mô tả, phương pháp thu thập", type: "textarea" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const themeIcon: Record<string, LucideIcon> = {
  "Đất đai": Mountain,
  "Khí hậu": CloudRain,
  "Thủy văn": Waves,
  "Cơ cấu cây trồng": Wheat,
  "Cơ cấu vật nuôi": Wheat,
  "Hạ tầng nghiên cứu": Building2,
};

export default async function BaseDataPage({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const { theme = "" } = await searchParams;
  const [all, counts] = await Promise.all([baseDatasetStore.list(), countObservations()]);
  const rows = all.filter((d) => !theme || d.theme === theme).sort((a, b) => a.theme.localeCompare(b.theme) || a.code.localeCompare(b.code));

  return (
    <>
      <Header title="Dữ liệu nền" description="Đất đai, khí hậu, thủy văn, cơ cấu cây trồng – vật nuôi, hạ tầng nghiên cứu: danh mục bộ dữ liệu và số liệu" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {BASE_THEMES.map((t) => {
            const Icon = themeIcon[t] ?? Database;
            const n = all.filter((d) => d.theme === t).length;
            return (
              <Link key={t} href={theme === t ? "/base-data" : `/base-data?theme=${encodeURIComponent(t)}`} className={`rounded-xl border p-4 bg-card hover:border-primary/50 ${theme === t ? "border-primary ring-1 ring-primary" : ""}`}>
                <Icon className="w-5 h-5 text-primary" />
                <div className="text-sm font-medium mt-2">{t}</div>
                <div className="text-xs text-muted-foreground">{n} bộ dữ liệu</div>
              </Link>
            );
          })}
        </section>
        <CrudTableCard
          title={theme ? `Bộ dữ liệu – ${theme}` : "Danh mục bộ dữ liệu"}
          description="Bấm mã để xem số liệu, biểu đồ và nhập số liệu từ Excel"
          endpoint="/api/base-datasets"
          entity="base-datasets"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/base-datasets" title="Thêm bộ dữ liệu" fields={FIELDS} addLabel="Thêm bộ dữ liệu" />}
          headers={["Mã / chủ đề", "Bộ dữ liệu", "Địa bàn · thời kỳ", "Nguồn", "Số liệu"]}
          emptyText="Chưa có bộ dữ liệu nào"
          rows={rows.map((d) => ({
            id: d.id,
            label: d.code,
            initial: d,
            cells: [
              <div key="c"><Link href={`/base-data/${d.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{d.code}</Link><div className="text-[11px] text-muted-foreground">{d.theme}</div></div>,
              <div key="t" className="max-w-[320px]"><div className="text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{clip(d.description || "", 90)}</div></div>,
              <div key="a" className="text-xs">{d.area || "—"}<div className="text-muted-foreground">{d.period}</div></div>,
              <div key="s" className="text-xs">{d.source || "—"}<div className="text-muted-foreground">{d.updateFrequency}</div></div>,
              <Badge key="n" variant={counts.get(d.id) ? "success" : "secondary"}>{(counts.get(d.id) ?? 0).toLocaleString("vi-VN")} dòng</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
