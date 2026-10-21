import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { breedStandardStore, standardCriterionStore } from "@/lib/modules/m3/data/breeding";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chỉ tiêu trong bộ" };

const fmtLimit = (v: number | null) => (v == null ? "" : v.toLocaleString("vi-VN"));

export default async function BreedStandardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [standards, criteria] = await Promise.all([breedStandardStore.list(), standardCriterionStore.list()]);
  const s = standards.find((x) => x.id === id);
  if (!s) notFound();
  const mine = criteria.filter((c) => c.standardId === id).sort((a, b) => a.sortOrder - b.sortOrder || a.criterion.localeCompare(b.criterion, "vi"));
  const fields: CrudField[] = [
    { name: "standardId", label: "Bộ chỉ tiêu", type: "select", options: [{ value: s.id, label: s.code }], defaultValue: s.id },
    { name: "criterion", label: "Chỉ tiêu", required: true, full: true, placeholder: "VD: Độ sạch, Tỷ lệ nảy mầm, Độ ẩm, Hạt khác giống" },
    { name: "unit", label: "Đơn vị", placeholder: "%, hạt/kg…" },
    { name: "sortOrder", label: "Thứ tự", type: "number" },
    { name: "minValue", label: "Tối thiểu (trống = không giới hạn)", type: "number", nullable: true },
    { name: "maxValue", label: "Tối đa (trống = không giới hạn)", type: "number", nullable: true },
    { name: "method", label: "Phương pháp thử", full: true },
  ];
  return (
    <>
      <Header title={`${s.code} · ${s.name}`} description={[s.kind, s.species, s.level].filter(Boolean).join(" · ")} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <Link href="/breed-standards" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Bộ chỉ tiêu giống
        </Link>
        <CrudTableCard
          title="Chỉ tiêu và ngưỡng"
          description="Kết quả đạt khi nằm trong [tối thiểu, tối đa]; để trống một phía là không giới hạn phía đó (nhập 0 nghĩa là đúng bằng 0)"
          endpoint="/api/standard-criteria"
          entity="standard-criteria"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/standard-criteria" title="Thêm chỉ tiêu" fields={fields} addLabel="Thêm chỉ tiêu" />}
          headers={["#", "Chỉ tiêu", "Yêu cầu", "Phương pháp"]}
          emptyText="Chưa có chỉ tiêu"
          rows={mine.map((c, i) => ({
            id: c.id,
            label: c.criterion,
            initial: c,
            cells: [
              <span key="i" className="text-xs text-muted-foreground">{i + 1}</span>,
              <span key="c" className="text-sm">{c.criterion}</span>,
              <span key="r" className="text-sm tabular-nums whitespace-nowrap">
                {c.minValue != null && c.maxValue != null ? `${fmtLimit(c.minValue)} – ${fmtLimit(c.maxValue)}` : c.minValue != null ? `≥ ${fmtLimit(c.minValue)}` : c.maxValue != null ? `≤ ${fmtLimit(c.maxValue)}` : "không giới hạn"} {c.unit}
              </span>,
              <span key="m" className="text-xs">{c.method || "—"}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
