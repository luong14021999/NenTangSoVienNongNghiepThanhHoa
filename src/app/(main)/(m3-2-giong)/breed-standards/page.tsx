import Link from "next/link";
import { Header } from "@/components/layout/header";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { breedStandardStore, standardCriterionStore } from "@/lib/modules/m3/data/breeding";
import { SEED_LEVEL_NAMES, STANDARD_KINDS } from "@/lib/modules/m3/breeding-rules";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bộ chỉ tiêu giống" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Số hiệu quy chuẩn / tiêu chuẩn", required: true, mono: true },
  { name: "kind", label: "Loại", type: "select", options: [...STANDARD_KINDS] },
  { name: "name", label: "Tên bộ chỉ tiêu", required: true, full: true },
  { name: "species", label: "Loài áp dụng" },
  { name: "level", label: "Cấp giống áp dụng", type: "select", options: ["", ...SEED_LEVEL_NAMES] },
  { name: "validFrom", label: "Áp dụng từ", type: "date" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

export default async function BreedStandardsPage() {
  const [all, criteria] = await Promise.all([breedStandardStore.list(), standardCriterionStore.list()]);
  return (
    <>
      <Header title="Bộ chỉ tiêu giống" description="Chỉ tiêu và ngưỡng theo quy chuẩn, tiêu chuẩn – căn cứ đánh giá khảo nghiệm, kiểm định, chứng nhận lô giống" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <CrudTableCard
          title="Danh sách bộ chỉ tiêu"
          description="Bấm số hiệu để nhập chỉ tiêu và ngưỡng. Đặt tên chỉ tiêu trùng tên chỉ tiêu phân tích ở M2 để tự đối chiếu kết quả kiểm nghiệm"
          endpoint="/api/breed-standards"
          entity="breed-standards"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-standards" title="Thêm bộ chỉ tiêu" fields={FIELDS} addLabel="Thêm bộ chỉ tiêu" />}
          headers={["Số hiệu", "Tên", "Loại", "Áp dụng", "Số chỉ tiêu"]}
          emptyText="Chưa có bộ chỉ tiêu – nhập theo quy chuẩn, tiêu chuẩn Viện áp dụng"
          rows={[...all].sort((a, b) => a.code.localeCompare(b.code)).map((s) => ({
            id: s.id,
            label: s.code,
            initial: s,
            cells: [
              <Link key="c" href={`/breed-standards/${s.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{s.code}</Link>,
              <span key="n" className="text-sm">{s.name}</span>,
              <span key="k" className="text-xs">{s.kind}</span>,
              <span key="a" className="text-xs">{[s.species, s.level, s.validFrom && `từ ${fmtDateVN(s.validFrom)}`].filter(Boolean).join(" · ") || "—"}</span>,
              <span key="q" className="text-sm">{criteria.filter((c) => c.standardId === s.id).length}</span>,
            ],
          }))}
        />
      </main>
    </>
  );
}
