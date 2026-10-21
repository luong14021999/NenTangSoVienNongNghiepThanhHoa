import Link from "next/link";
import { Users, GitBranch, AlertTriangle, ClipboardCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { individualStore, selectionRecordStore, sourceStockStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { INBREEDING_WARN, INDIVIDUAL_STATUSES, SEXES, inbreeding } from "@/lib/modules/m3/breeding-rules";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Phả hệ & chọn lọc" };

export default async function IndividualsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, stocks, varieties, records] = await Promise.all([individualStore.list(), sourceStockStore.list(), varietyStore.list(), selectionRecordStore.list()]);
  const byIdMap = byId(all);
  const stockById = byId(stocks);
  const F = inbreeding(all);
  const males = all.filter((i) => i.sex !== "Cái");
  const females = all.filter((i) => i.sex !== "Đực");
  const fields: CrudField[] = [
    { name: "code", label: "Số hiệu (số tai / số cây)", required: true, mono: true },
    { name: "sex", label: "Giới tính", type: "select", options: [...SEXES] },
    { name: "stockId", label: "Thuộc đàn / vườn", type: "select", options: refOptions(stocks, (s) => `${s.code} · ${s.name}`) },
    { name: "varietyId", label: "Giống", type: "select", options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "sireId", label: "Bố", type: "select", options: refOptions(males, (i) => i.code) },
    { name: "damId", label: "Mẹ", type: "select", options: refOptions(females, (i) => i.code) },
    { name: "bornAt", label: "Ngày sinh / trồng", type: "date" },
    { name: "generation", label: "Thế hệ", placeholder: "VD: G0, F1, thế hệ chọn lọc 3" },
    { name: "status", label: "Tình trạng", type: "select", options: [...INDIVIDUAL_STATUSES] },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => a.code.localeCompare(b.code)).filter((i) => matches(query, i.code, i.generation, stockById.get(i.stockId)?.name));
  const inbred = all.filter((i) => F.of(i.id) >= INBREEDING_WARN);

  return (
    <>
      <Header title="Phả hệ & chọn lọc" description="Cá thể giống gốc, bố – mẹ, hệ số cận huyết, chỉ tiêu chọn lọc" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Cá thể", value: all.length, icon: Users, accent: "bg-blue-50 text-blue-600" },
            { label: "Có đủ bố mẹ", value: all.filter((i) => i.sireId && i.damId).length, icon: GitBranch, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Cận huyết ≥ 6,25%", value: inbred.length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600" },
            { label: "Lượt đo chọn lọc", value: records.length, icon: ClipboardCheck, accent: "bg-violet-50 text-violet-600" },
          ]}
        />
        <div className="flex justify-end">
          <EntitySearchInput basePath="/individuals" placeholder="Tìm số hiệu, thế hệ, đàn…" />
        </div>
        <CrudTableCard
          title="Danh sách cá thể"
          description="Bấm số hiệu để xem cây phả hệ 3 đời, đời con và chỉ tiêu chọn lọc"
          endpoint="/api/individuals"
          entity="individuals"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/individuals" title="Thêm cá thể" fields={fields} addLabel="Thêm cá thể" />}
          headers={["Số hiệu", "Đàn · giống", "Bố × Mẹ", "Thế hệ · ngày sinh", "Cận huyết F", "Tình trạng"]}
          emptyText={query ? "Không có cá thể phù hợp" : "Chưa có cá thể"}
          rows={rows.map((i) => {
            const f = F.of(i.id);
            return {
              id: i.id,
              label: i.code,
              initial: i,
              cells: [
                <div key="c"><Link href={`/individuals/${i.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{i.code}</Link><div className="text-[11px] text-muted-foreground">{i.sex}</div></div>,
                <div key="s" className="text-xs">{stockById.get(i.stockId)?.name ?? "—"}<div className="text-muted-foreground">{varieties.find((v) => v.id === i.varietyId)?.name ?? ""}</div></div>,
                <span key="p" className="text-xs font-mono">{byIdMap.get(i.sireId)?.code ?? "?"} × {byIdMap.get(i.damId)?.code ?? "?"}</span>,
                <div key="g" className="text-xs">{i.generation || "—"}<div className="text-muted-foreground">{fmtDateVN(i.bornAt)}</div></div>,
                <span key="f" className={`text-xs ${f >= INBREEDING_WARN ? "text-rose-600 font-medium" : ""}`}>{(f * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%</span>,
                <Badge key="st" variant={i.status === "Đang sử dụng" ? "success" : "secondary"}>{i.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
