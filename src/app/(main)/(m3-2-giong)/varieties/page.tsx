import Link from "next/link";
import { Sprout, Award, FileCheck2, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import { BREED_KINDS, breedTrialStore, varietyDocumentStore, varietyStore, type Variety } from "@/lib/modules/m3/data/breeding";
import { ipAssetStore } from "@/lib/modules/m4/data/knowledge";
import { VARIETY_SCOPES, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { varietyFields } from "@/lib/modules/m3/variety-fields";
import { byId, matches } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lý lịch giống" };

const statusVariant: Record<Variety["status"], "warning" | "success" | "default" | "secondary"> = {
  "Đang khảo nghiệm": "warning",
  "Được công nhận": "success",
  "Lưu hành": "default",
  "Ngừng sản xuất": "secondary",
};

export default async function VarietiesPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; scope?: string }> }) {
  const { q = "", kind = "", scope = "" } = await searchParams;
  const [all, trials, ipAssets, docs] = await Promise.all([varietyStore.list(), breedTrialStore.list(), ipAssetStore.list(), varietyDocumentStore.list()]);
  const ipById = byId(ipAssets);
  const today = todayISO();
  const fields = varietyFields(ipAssets);
  const query = q.trim().toLowerCase();
  const rows = [...all]
    .sort((a, b) => a.code.localeCompare(b.code))
    .filter((x) => (!kind || x.kind === kind) && (!scope || x.scope === scope) && matches(query, x.code, x.name, x.species, x.owner, x.recognitionNo, x.circulationNo, x.regions));
  const expiring = docs.filter((d) => validityAlert(d.validUntil, today));
  const filterLink = (k: string, s: string) => `/varieties?${new URLSearchParams({ ...(q && { q }), ...(k && { kind: k }), ...(s && { scope: s }) })}`;

  return (
    <>
      <Header title="Lý lịch & hồ sơ pháp lý giống" description="Giống của Viện và giống trên địa bàn tỉnh: nguồn gốc, đặc tính, tác giả, công nhận, lưu hành, bảo hộ" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Giống của Viện", value: all.filter((x) => x.scope !== "Giống trên địa bàn tỉnh").length, icon: Sprout, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Giống trên địa bàn tỉnh", value: all.filter((x) => x.scope === "Giống trên địa bàn tỉnh").length, icon: Award, accent: "bg-blue-50 text-blue-600" },
            { label: "Đã lưu hành", value: all.filter((x) => x.circulationType && x.circulationType !== "Chưa lưu hành").length, icon: FileCheck2, accent: "bg-violet-50 text-violet-600" },
            { label: "Văn bản sắp / hết hiệu lực", value: expiring.length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "trong 90 ngày" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {["", ...VARIETY_SCOPES].map((s) => (
            <Link key={s || "all-scope"} href={filterLink(kind, s)} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${scope === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>{s || "Mọi phạm vi"}</Link>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          {["", ...BREED_KINDS].map((k) => (
            <Link key={k || "all-kind"} href={filterLink(k, scope)} className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}>
              {k || "Mọi nhóm"} <span className="ml-1.5 opacity-70">{k ? all.filter((x) => x.kind === k).length : all.length}</span>
            </Link>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/varieties" placeholder="Tìm mã, tên, loài, tác giả, số QĐ, vùng…" />
          </div>
        </div>
        <CrudTableCard
          title="Danh sách giống"
          description="Bấm mã giống để xem hồ sơ pháp lý, nguồn giống gốc, khảo nghiệm, sản xuất và lô giống"
          endpoint="/api/varieties"
          entity="varieties"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/varieties" title="Thêm giống" fields={fields} addLabel="Thêm giống" />}
          headers={["Mã / nhóm", "Tên giống", "Công nhận", "Lưu hành · bảo hộ", "Khảo nghiệm", "Trạng thái"]}
          emptyText={query || kind || scope ? "Không có giống phù hợp" : "Chưa có giống nào"}
          rows={rows.map((x) => {
            const ip = ipById.get(x.ipAssetId);
            const docAlert = docs.filter((d) => d.varietyId === x.id).some((d) => validityAlert(d.validUntil, today));
            return {
              id: x.id,
              label: x.name,
              initial: x,
              cells: [
                <div key="c"><Link href={`/varieties/${x.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{x.code}</Link><div className="text-[11px] text-muted-foreground">{x.kind} · {x.scope}</div></div>,
                <div key="n" className="max-w-[260px]">
                  <div className="text-sm font-medium">{x.name}</div>
                  <div className="text-[11px] text-muted-foreground">{[x.species, x.owner, clip(x.traits, 50)].filter(Boolean).join(" · ") || "—"}</div>
                </div>,
                <div key="r" className="text-xs"><span className="font-mono">{x.recognitionNo || "—"}</span><div className="text-muted-foreground">{fmtDateVN(x.recognizedAt)}</div></div>,
                <div key="l" className="text-xs">
                  {x.circulationType || "—"}{x.circulationNo && <span className="font-mono"> · {x.circulationNo}</span>}
                  <div className="text-muted-foreground">{ip ? `Bảo hộ ${ip.grantNo || ip.status}` : ""}</div>
                  {docAlert && <div className="text-rose-600">văn bản sắp / hết hiệu lực</div>}
                </div>,
                <span key="t" className="text-sm">{trials.filter((t) => t.varietyId === x.id).length}</span>,
                <Badge key="s" variant={statusVariant[x.status] ?? "secondary"}>{x.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
