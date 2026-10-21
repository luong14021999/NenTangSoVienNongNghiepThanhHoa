import Link from "next/link";
import { ClipboardCheck, Hourglass, CheckCircle2, XCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { TRIAL_KINDS, TRIAL_RESULTS, breedStandardStore, breedTrialStore, varietyStore, type BreedTrial } from "@/lib/modules/m3/data/breeding";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Khảo nghiệm giống" };

const resultVariant: Record<BreedTrial["result"], "warning" | "success" | "destructive"> = {
  "Đang theo dõi": "warning",
  "Đạt": "success",
  "Không đạt": "destructive",
};

export default async function BreedTrialsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, varieties, standards] = await Promise.all([breedTrialStore.list(), varietyStore.list(), breedStandardStore.list()]);
  const varietyById = byId(varieties);
  const fields: CrudField[] = [
    { name: "code", label: "Mã khảo nghiệm", required: true, mono: true, placeholder: "VD: KN-2026-001" },
    { name: "varietyId", label: "Giống", type: "select", required: true, options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "kind", label: "Loại", type: "select", options: [...TRIAL_KINDS] },
    { name: "standardId", label: "Bộ chỉ tiêu đánh giá", type: "select", options: refOptions(standards, (x) => `${x.code} · ${x.name}`) },
    { name: "season", label: "Vụ / đợt", placeholder: "VD: Vụ Xuân 2026" },
    { name: "site", label: "Địa điểm", full: true },
    { name: "startAt", label: "Bắt đầu", type: "date" },
    { name: "endAt", label: "Kết thúc", type: "date" },
    { name: "leader", label: "Chủ trì" },
    { name: "result", label: "Kết quả", type: "select", options: [...TRIAL_RESULTS] },
    { name: "yield", label: "Năng suất / chỉ tiêu chính", type: "textarea" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];

  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => b.code.localeCompare(a.code))
    .filter((x) => matches(query, x.code, x.site, x.season, x.leader, varietyById.get(x.varietyId)?.name));
  const count = (r: BreedTrial["result"]) => all.filter((x) => x.result === r).length;

  return (
    <>
      <Header title="Khảo nghiệm giống" description="Khảo nghiệm VCU, DUS, sản xuất thử và so sánh giống theo vụ và địa điểm" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Khảo nghiệm", value: all.length, icon: ClipboardCheck, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang theo dõi", value: count("Đang theo dõi"), icon: Hourglass, accent: "bg-amber-50 text-amber-600" },
            { label: "Đạt", value: count("Đạt"), icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Không đạt", value: count("Không đạt"), icon: XCircle, accent: "bg-rose-50 text-rose-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/breed-trials" placeholder="Tìm mã, giống, địa điểm, vụ, chủ trì…" />
        </div>
        <CrudTableCard
          title="Danh sách khảo nghiệm"
          description="Bấm mã khảo nghiệm để nhập số đo và tự đối chiếu với bộ chỉ tiêu; kết quả Đạt là căn cứ đề nghị công nhận giống"
          endpoint="/api/breed-trials"
          entity="breed-trials"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/breed-trials" title="Thêm khảo nghiệm" fields={fields} addLabel="Thêm khảo nghiệm" />}
          headers={["Mã / loại", "Giống", "Vụ · địa điểm", "Thời gian", "Năng suất / chỉ tiêu", "Kết quả"]}
          emptyText={query ? "Không có khảo nghiệm phù hợp" : "Chưa có khảo nghiệm nào"}
          rows={rows.map((x) => {
            const v = varietyById.get(x.varietyId);
            return {
              id: x.id,
              label: x.code,
              initial: x,
              cells: [
                <div key="c">
                  <Link href={`/breed-trials/${x.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{x.code}</Link>
                  <div className="text-[11px] text-muted-foreground">{x.kind}</div>
                </div>,
                <div key="v">
                  <div className="text-sm font-medium">{v?.name ?? "—"}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{v?.code}</div>
                </div>,
                <div key="s" className="text-xs max-w-[220px]">
                  {x.season || "—"}
                  <div className="text-muted-foreground">{x.site}</div>
                </div>,
                <span key="t" className="text-xs whitespace-nowrap">
                  {fmtDateVN(x.startAt) || "—"} → {fmtDateVN(x.endAt) || "…"}
                </span>,
                <span key="y" className="text-xs">{clip(x.yield || "—", 70)}</span>,
                <div key="r">
                  <Badge variant={resultVariant[x.result] ?? "secondary"}>{x.result}</Badge>
                  {x.leader && <div className="text-[11px] text-muted-foreground mt-0.5">{x.leader}</div>}
                </div>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
