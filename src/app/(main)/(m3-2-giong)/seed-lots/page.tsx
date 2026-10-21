import Link from "next/link";
import { Package, ShieldCheck, Clock, AlertTriangle, Printer } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import { EntityFormDialog, type CrudField } from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/common/stat-grid";
import { breedStandardStore, deliveryStore, productionLotStore, seedLotStore, varietyStore } from "@/lib/modules/m3/data/breeding";
import { FIELD_RESULTS, QTY_UNITS, SEED_LEVEL_NAMES, SEED_LOT_STATUSES, validityAlert } from "@/lib/modules/m3/breeding-rules";
import { byId, matches, refOptions } from "@/lib/platform/ref-options";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lô giống" };

const statusVariant: Record<string, "warning" | "success" | "destructive" | "default" | "secondary"> = {
  "Chờ kiểm định": "warning",
  "Đạt": "default",
  "Không đạt": "destructive",
  "Đã chứng nhận": "success",
  "Hết hiệu lực": "secondary",
};

export default async function SeedLotsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [all, varieties, prodLots, standards, deliveries] = await Promise.all([
    seedLotStore.list(),
    varietyStore.list(),
    productionLotStore.list(),
    breedStandardStore.list(),
    deliveryStore.list(),
  ]);
  const varietyById = byId(varieties);
  const today = todayISO();
  const fields: CrudField[] = [
    { name: "code", label: "Mã lô giống (in trên bao bì / tem QR)", required: true, mono: true, placeholder: "VD: LG-2026-001" },
    { name: "varietyId", label: "Giống", type: "select", options: refOptions(varieties, (v) => `${v.code} · ${v.name}`) },
    { name: "level", label: "Cấp giống", type: "select", required: true, options: [...SEED_LEVEL_NAMES] },
    { name: "productionLotId", label: "Từ lô sản xuất", type: "select", options: refOptions(prodLots, (p) => `${p.code} · ${p.level} · ${p.season}`) },
    { name: "quantity", label: "Khối lượng / số lượng", type: "number" },
    { name: "unit", label: "Đơn vị", type: "select", options: [...QTY_UNITS] },
    { name: "producedAt", label: "Ngày sản xuất / thu hoạch", type: "date" },
    { name: "standardId", label: "Bộ chỉ tiêu chất lượng", type: "select", options: refOptions(standards, (s) => `${s.code} · ${s.name}`) },
    { name: "sampleCode", label: "Mã mẫu kiểm nghiệm (M2)", mono: true },
    { name: "fieldInspectedAt", label: "Ngày kiểm định ruộng / đàn giống", type: "date" },
    { name: "fieldResult", label: "Kết quả kiểm định", type: "select", options: [...FIELD_RESULTS] },
    { name: "status", label: "Tình trạng", type: "select", options: [...SEED_LOT_STATUSES] },
    { name: "certificateNo", label: "Số giấy chứng nhận chất lượng", mono: true },
    { name: "certifiedAt", label: "Ngày chứng nhận", type: "date" },
    { name: "conformityNo", label: "Số chứng nhận / công bố hợp quy", mono: true },
    { name: "conformityUntil", label: "Hợp quy hiệu lực đến", type: "date" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const query = q.trim().toLowerCase();
  const rows = [...all].sort((a, b) => b.code.localeCompare(a.code)).filter((s) => matches(query, s.code, s.level, s.certificateNo, varietyById.get(s.varietyId)?.name));
  const leftOf = (id: string, qty: number) => qty - deliveries.filter((d) => d.seedLotId === id).reduce((s, d) => s + d.quantity, 0);

  return (
    <>
      <Header title="Lô giống – kiểm định, chứng nhận" description="Lô giống theo cấp: kiểm định ruộng / đàn, kiểm nghiệm tại M2, chứng nhận chất lượng, hợp quy – đơn vị cung ứng và truy xuất QR" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Lô giống", value: all.length, icon: Package, accent: "bg-blue-50 text-blue-600" },
            { label: "Chờ kiểm định", value: all.filter((s) => s.status === "Chờ kiểm định").length, icon: Clock, accent: "bg-amber-50 text-amber-600" },
            { label: "Đã chứng nhận", value: all.filter((s) => s.status === "Đã chứng nhận").length, icon: ShieldCheck, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Hợp quy sắp / hết hạn", value: all.filter((s) => validityAlert(s.conformityUntil, today)).length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "trong 90 ngày" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={`/seed-lot-labels?codes=${encodeURIComponent(rows.filter((s) => s.status === "Đạt" || s.status === "Đã chứng nhận").map((s) => s.code).join(","))}`} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border bg-background text-sm hover:bg-accent">
            <Printer className="w-4 h-4" /> In tem QR (lô đạt, đang lọc)
          </Link>
          <EntitySearchInput basePath="/seed-lots" placeholder="Tìm mã lô, cấp, giống, số chứng nhận…" />
        </div>
        <CrudTableCard
          title="Danh sách lô giống"
          description="Bấm mã lô để đối chiếu bộ chỉ tiêu với kết quả kiểm nghiệm M2 và xem chuỗi cấp giống. Chỉ lô Đạt / Đã chứng nhận, còn hiệu lực hợp quy mới được giao"
          endpoint="/api/seed-lots"
          entity="seed-lots"
          editFields={fields}
          addNode={<EntityFormDialog mode="add" endpoint="/api/seed-lots" title="Thêm lô giống" fields={fields} addLabel="Thêm lô giống" />}
          headers={["Mã / cấp", "Giống", "Số lượng · còn lại", "Kiểm định · kiểm nghiệm", "Chứng nhận · hợp quy", "Tình trạng"]}
          emptyText={query ? "Không có lô phù hợp" : "Chưa có lô giống"}
          rows={rows.map((s) => {
            const a = validityAlert(s.conformityUntil, today);
            return {
              id: s.id,
              label: s.code,
              initial: s,
              cells: [
                <div key="c"><Link href={`/seed-lots/${s.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">{s.code}</Link><div className="text-[11px] text-muted-foreground">{s.level}</div></div>,
                <span key="v" className="text-sm">{varietyById.get(s.varietyId)?.name ?? "—"}</span>,
                <div key="q" className="text-xs whitespace-nowrap">{s.quantity.toLocaleString("vi-VN")} {s.unit}<div className="text-muted-foreground">còn {leftOf(s.id, s.quantity).toLocaleString("vi-VN")}</div></div>,
                <div key="k" className="text-xs">{s.fieldResult}{s.fieldInspectedAt && ` · ${fmtDateVN(s.fieldInspectedAt)}`}<div className="text-muted-foreground font-mono">{s.sampleCode || "chưa gắn mẫu M2"}</div></div>,
                <div key="g" className="text-xs">
                  <span className="font-mono">{s.certificateNo || "—"}</span>
                  {s.conformityNo && <div className="text-muted-foreground">HQ {s.conformityNo}{s.conformityUntil && ` → ${fmtDateVN(s.conformityUntil)}`}</div>}
                  {a && <div className={a.kind === "Hết hiệu lực" ? "text-rose-600 font-medium" : "text-amber-600"}>hợp quy {a.kind.toLowerCase()} {a.days} ngày</div>}
                </div>,
                <Badge key="st" variant={statusVariant[s.status] ?? "secondary"}>{s.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
