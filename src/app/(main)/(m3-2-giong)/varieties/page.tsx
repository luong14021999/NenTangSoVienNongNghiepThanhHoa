import Link from "next/link";
import { Sprout, Award, FlaskConical, PauseCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { BREED_KINDS, VARIETY_STATUSES, breedTrialStore, varietyStore, type Variety } from "@/lib/modules/m3/data/breeding";
import { matches } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lý lịch giống" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã giống", required: true, mono: true, placeholder: "VD: GI-001" },
  { name: "name", label: "Tên giống", required: true },
  { name: "kind", label: "Nhóm", type: "select", options: [...BREED_KINDS] },
  { name: "species", label: "Loài", placeholder: "VD: Lúa, Ngô, Lợn, Tôm…" },
  { name: "origin", label: "Nguồn gốc / tổ hợp lai", full: true },
  { name: "owner", label: "Tác giả / chủ sở hữu" },
  { name: "status", label: "Trạng thái", type: "select", options: [...VARIETY_STATUSES] },
  { name: "recognitionNo", label: "Số quyết định công nhận", mono: true },
  { name: "recognizedAt", label: "Ngày công nhận", type: "date" },
  { name: "traits", label: "Đặc điểm chính (thời gian sinh trưởng, năng suất, chống chịu…)", type: "textarea" },
  { name: "note", label: "Ghi chú", type: "textarea" },
];

const statusVariant: Record<Variety["status"], "warning" | "success" | "default" | "secondary"> = {
  "Đang khảo nghiệm": "warning",
  "Được công nhận": "success",
  "Lưu hành": "default",
  "Ngừng sản xuất": "secondary",
};

export default async function VarietiesPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string }> }) {
  const { q = "", kind = "" } = await searchParams;
  const [all, trials] = await Promise.all([varietyStore.list(), breedTrialStore.list()]);
  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => a.code.localeCompare(b.code))
    .filter((x) => (!kind || x.kind === kind) && matches(query, x.code, x.name, x.species, x.owner, x.recognitionNo));
  const trialCount = (id: string) => trials.filter((t) => t.varietyId === id).length;

  return (
    <>
      <Header title="Lý lịch giống" description="Giống cây trồng, vật nuôi, thủy sản: nguồn gốc, tác giả, quyết định công nhận và đặc điểm chính" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Giống", value: all.length, icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Được công nhận / lưu hành", value: all.filter((x) => x.status === "Được công nhận" || x.status === "Lưu hành").length, icon: Award, accent: "bg-blue-50 text-blue-600" },
            { label: "Đang khảo nghiệm", value: all.filter((x) => x.status === "Đang khảo nghiệm").length, icon: FlaskConical, accent: "bg-amber-50 text-amber-600" },
            { label: "Ngừng sản xuất", value: all.filter((x) => x.status === "Ngừng sản xuất").length, icon: PauseCircle, accent: "bg-slate-100 text-slate-600" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {["", ...BREED_KINDS].map((k) => (
            <Link
              key={k || "all"}
              href={`/varieties?${new URLSearchParams({ ...(q && { q }), ...(k && { kind: k }) })}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >
              {k || "Tất cả"} <span className="ml-1.5 opacity-70">{k ? all.filter((x) => x.kind === k).length : all.length}</span>
            </Link>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/varieties" placeholder="Tìm mã, tên, loài, tác giả, số QĐ…" />
          </div>
        </div>
        <CrudTableCard
          title="Danh sách giống"
          description="Cột Khảo nghiệm đếm số lần khảo nghiệm đã ghi cho giống"
          endpoint="/api/varieties"
          entity="varieties"
          editFields={FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/varieties" title="Thêm giống" fields={FIELDS} addLabel="Thêm giống" />}
          headers={["Mã / nhóm", "Tên giống", "Nguồn gốc · tác giả", "Công nhận", "Khảo nghiệm", "Trạng thái"]}
          emptyText={query || kind ? "Không có giống phù hợp" : "Chưa có giống nào"}
          rows={rows.map((x) => ({
            id: x.id,
            label: x.name,
            initial: x,
            cells: [
              <div key="c">
                <div className="font-mono text-xs font-semibold">{x.code}</div>
                <div className="text-[11px] text-muted-foreground">{x.kind}</div>
              </div>,
              <div key="n" className="max-w-[260px]">
                <div className="text-sm font-medium">{x.name}</div>
                <div className="text-[11px] text-muted-foreground">{[x.species, clip(x.traits, 60)].filter(Boolean).join(" · ") || "—"}</div>
              </div>,
              <div key="o" className="text-xs max-w-[220px]">
                {x.origin || "—"}
                {x.owner && <div className="text-muted-foreground">{x.owner}</div>}
              </div>,
              <div key="r" className="text-xs">
                <span className="font-mono">{x.recognitionNo || "—"}</span>
                <div className="text-muted-foreground">{fmtDateVN(x.recognizedAt)}</div>
              </div>,
              <span key="t" className="text-sm">{trialCount(x.id)}</span>,
              <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
            ],
          }))}
        />
      </main>
    </>
  );
}
