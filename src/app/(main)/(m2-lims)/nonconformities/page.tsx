import Link from "next/link";
import { OctagonAlert, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid, clip } from "@/components/common/stat-grid";
import {
  NC_SEVERITIES,
  NC_SOURCES,
  NC_STATUSES,
  isOpenNc,
  nonconformityStore,
  type Nonconformity,
} from "@/lib/modules/m2/data/qms";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Không phù hợp & CAPA" };

const FIELDS: CrudField[] = [
  { name: "code", label: "Mã", required: true, mono: true, placeholder: "VD: NC-2026-001" },
  { name: "detectedAt", label: "Ngày phát hiện", type: "date" },
  { name: "source", label: "Nguồn phát hiện", type: "select", options: [...NC_SOURCES] },
  { name: "refCode", label: "Mã tham chiếu", mono: true, placeholder: "Mã đánh giá / khiếu nại / mẫu" },
  { name: "clause", label: "Điều khoản ISO 17025", placeholder: "VD: 7.7" },
  { name: "severity", label: "Mức độ", type: "select", options: [...NC_SEVERITIES] },
  { name: "description", label: "Mô tả sự không phù hợp", type: "textarea", required: true },
  { name: "impact", label: "Đánh giá mức ảnh hưởng (§7.10) – có cần thu hồi kết quả / thông báo khách hàng?", type: "textarea" },
  { name: "immediateAction", label: "Khắc phục tức thời", type: "textarea" },
  { name: "rootCause", label: "Nguyên nhân gốc (§8.7.1)", type: "textarea" },
  { name: "correctiveAction", label: "Hành động khắc phục", type: "textarea" },
  { name: "owner", label: "Người phụ trách" },
  { name: "dueAt", label: "Thời hạn", type: "date" },
  { name: "status", label: "Trạng thái", type: "select", options: [...NC_STATUSES] },
  { name: "closedAt", label: "Ngày đóng", type: "date" },
  { name: "effectiveness", label: "Đánh giá hiệu lực (§8.7.1)", type: "textarea" },
];

const statusVariant: Record<Nonconformity["status"], "destructive" | "warning" | "default" | "success"> = {
  "Mở": "destructive",
  "Đang xử lý": "warning",
  "Chờ đánh giá hiệu lực": "default",
  "Đã đóng": "success",
};

const STEPS: { key: keyof Nonconformity; label: string }[] = [
  { key: "impact", label: "Đánh giá ảnh hưởng" },
  { key: "immediateAction", label: "Khắc phục tức thời" },
  { key: "rootCause", label: "Nguyên nhân gốc" },
  { key: "correctiveAction", label: "Hành động khắc phục" },
  { key: "effectiveness", label: "Đánh giá hiệu lực" },
];

function CapaProgress({ nc }: { nc: Nonconformity }) {
  const done = STEPS.filter((s) => String(nc[s.key] ?? "").trim());
  const missing = STEPS.filter((s) => !String(nc[s.key] ?? "").trim()).map((s) => s.label);
  return (
    <div title={missing.length ? `Còn thiếu: ${missing.join(", ")}` : "Đủ 5 bước"}>
      <div className="flex gap-0.5">
        {STEPS.map((s) => (
          <span
            key={s.key}
            className={`h-1.5 w-5 rounded-full ${String(nc[s.key] ?? "").trim() ? "bg-emerald-500" : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{done.length}/5 bước</div>
    </div>
  );
}

export default async function NonconformitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const all = (await nonconformityStore.list()).sort((a, b) =>
    (b.detectedAt || "").localeCompare(a.detectedAt || "") || b.code.localeCompare(a.code),
  );
  const query = q.trim().toLowerCase();
  const rows = all.filter(
    (n) =>
      (!status || (status === "open" ? isOpenNc(n) : n.status === status)) &&
      (!query ||
        `${n.code} ${n.refCode} ${n.description} ${n.owner} ${n.clause} ${n.source}`.toLowerCase().includes(query)),
  );

  const open = all.filter(isOpenNc);
  const overdue = open.filter((n) => daysUntil(n.dueAt) < 0);
  const yearAgo = String(Number(todayISO().slice(0, 4)) - 1) + todayISO().slice(4);
  const closed12m = all.filter((n) => n.status === "Đã đóng" && (n.closedAt || "") >= yearAgo);

  const chips = [
    { key: "", label: "Tất cả", n: all.length },
    { key: "open", label: "Đang mở", n: open.length },
    ...NC_STATUSES.map((s) => ({ key: s, label: s, n: all.filter((n) => n.status === s).length })),
  ];

  return (
    <>
      <Header
        title="Công việc không phù hợp & hành động khắc phục"
        description="ISO/IEC 17025:2017 §7.10 + §8.7 – nhận diện, đánh giá ảnh hưởng, nguyên nhân gốc, khắc phục và đánh giá hiệu lực (CAPA)"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đang mở", value: open.length, icon: OctagonAlert, accent: "bg-rose-50 text-rose-600" },
            { label: "Quá hạn xử lý", value: overdue.length, icon: Clock, accent: "bg-amber-50 text-amber-600" },
            { label: "Mức Nặng đang mở", value: open.filter((n) => n.severity === "Nặng").length, icon: ShieldAlert, accent: "bg-violet-50 text-violet-600" },
            { label: "Đã đóng (12 tháng)", value: closed12m.length, icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-700" },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link
              key={c.key || "all"}
              href={`/nonconformities?${new URLSearchParams({ ...(q && { q }), ...(c.key && { status: c.key }) })}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                status === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >
              {c.label} <span className="ml-1.5 opacity-70">{c.n}</span>
            </Link>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/nonconformities" placeholder="Tìm mã, mô tả, người phụ trách…" />
          </div>
        </div>

        <CrudTableCard
          title="Sổ theo dõi không phù hợp & CAPA"
          description="Ghi cả phát hiện từ đánh giá nội bộ, đánh giá của BoA, khiếu nại, QC/PT – dùng Mã tham chiếu để liên kết nguồn"
          endpoint="/api/nonconformities"
          entity="nonconformities"
          editFields={FIELDS}
          addNode={
            <EntityFormDialog
              mode="add"
              endpoint="/api/nonconformities"
              title="Ghi nhận công việc không phù hợp"
              fields={FIELDS.map((f) => (f.name === "detectedAt" ? { ...f, defaultValue: todayISO() } : f))}
              addLabel="Ghi nhận mới"
            />
          }
          headers={["Mã / ngày", "Nguồn", "Mô tả", "Mức độ", "Phụ trách / hạn", "Tiến trình", "Trạng thái"]}
          emptyText={query || status ? "Không có bản ghi phù hợp" : "Chưa có công việc không phù hợp nào được ghi nhận"}
          rows={rows.map((n) => {
            const days = daysUntil(n.dueAt);
            const late = isOpenNc(n) && days < 0;
            return {
              id: n.id,
              label: n.code,
              initial: n,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{n.code}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtDateVN(n.detectedAt) || "—"}</div>
                </div>,
                <div key="s" className="text-xs max-w-[150px]">
                  <div>{n.source}</div>
                  {(n.refCode || n.clause) && (
                    <div className="text-muted-foreground font-mono">
                      {[n.refCode, n.clause && `§${n.clause}`].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>,
                <div key="d" className="text-sm max-w-[340px] leading-snug">{clip(n.description)}</div>,
                <Badge key="v" variant={n.severity === "Nặng" ? "destructive" : "outline"}>{n.severity}</Badge>,
                <div key="o" className={`text-xs ${late ? "text-rose-600 font-medium" : ""}`}>
                  <div>{n.owner || "—"}</div>
                  <div>{fmtDateVN(n.dueAt) || "chưa đặt hạn"}{late && ` · quá ${-days} ngày`}</div>
                </div>,
                <CapaProgress key="p" nc={n} />,
                <Badge key="st" variant={statusVariant[n.status] ?? "secondary"}>{n.status}</Badge>,
              ],
            };
          })}
        />
      </main>
    </>
  );
}
