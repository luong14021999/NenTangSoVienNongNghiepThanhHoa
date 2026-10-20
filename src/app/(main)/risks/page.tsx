import Link from "next/link";
import { AlertOctagon, ShieldCheck, TrendingUp, ListChecks, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CrudTableCard } from "@/components/crud/crud-table-card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";
import { StatGrid } from "@/components/qms/stat-grid";
import {
  OPPORTUNITY_STATUSES,
  RISK_CATEGORIES,
  RISK_STATUSES,
  RISK_TREATMENTS,
  opportunityStore,
  riskStore,
} from "@/lib/data/quality";
import type { Risk } from "@/lib/mock-data";
import { daysUntil, fmtDateVN } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đăng ký rủi ro & cơ hội" };

const SCALE = ["1", "2", "3", "4", "5"];

const RISK_FIELDS: CrudField[] = [
  { name: "code", label: "Mã rủi ro", required: true, mono: true, placeholder: "VD: RR-11" },
  { name: "category", label: "Phân loại", type: "select", options: RISK_CATEGORIES },
  { name: "title", label: "Rủi ro", required: true, full: true },
  { name: "cause", label: "Nguyên nhân", type: "textarea" },
  { name: "effect", label: "Hậu quả", type: "textarea" },
  { name: "likelihood", label: "Khả năng xảy ra L (1–5)", type: "select", options: SCALE },
  { name: "impact", label: "Mức nghiêm trọng I (1–5)", type: "select", options: SCALE },
  { name: "controls", label: "Biện pháp kiểm soát hiện có", type: "textarea" },
  { name: "treatment", label: "Hướng xử lý", type: "select", options: RISK_TREATMENTS },
  { name: "owner", label: "Phụ trách" },
  { name: "action", label: "Hành động xử lý", type: "textarea" },
  { name: "residualLikelihood", label: "L tồn dư", type: "select", options: SCALE },
  { name: "residualImpact", label: "I tồn dư", type: "select", options: SCALE },
  { name: "reviewAt", label: "Ngày xem xét lại", type: "date" },
  { name: "status", label: "Trạng thái", type: "select", options: RISK_STATUSES },
  { name: "isoClause", label: "Điều khoản ISO 17025", placeholder: "VD: §4.1" },
];

const OPP_FIELDS: CrudField[] = [
  { name: "title", label: "Cơ hội cải tiến", required: true, full: true },
  { name: "description", label: "Mô tả", type: "textarea" },
  { name: "expectedBenefit", label: "Lợi ích kỳ vọng", full: true },
  { name: "owner", label: "Phụ trách" },
  { name: "status", label: "Trạng thái", type: "select", options: OPPORTUNITY_STATUSES },
];

function levelOf(score: number) {
  if (score >= 16) return { label: "Rất cao", color: "bg-rose-100 text-rose-700 border-rose-300", swatch: "bg-rose-500", variant: "destructive" as const };
  if (score >= 10) return { label: "Cao", color: "bg-orange-100 text-orange-700 border-orange-300", swatch: "bg-orange-500", variant: "warning" as const };
  if (score >= 5) return { label: "Trung bình", color: "bg-amber-100 text-amber-700 border-amber-300", swatch: "bg-amber-400", variant: "secondary" as const };
  return { label: "Thấp", color: "bg-emerald-100 text-emerald-700 border-emerald-300", swatch: "bg-emerald-500", variant: "success" as const };
}

const statusVariant = {
  "Mở": "destructive",
  "Đang xử lý": "warning",
  "Đã giảm thiểu": "secondary",
  "Đã đóng": "success",
} as const;

const opStatusVariant = {
  "Đề xuất": "secondary",
  "Đang triển khai": "warning",
  "Đã đạt": "success",
} as const;

const scoreOf = (r: Risk) => r.likelihood * r.impact;
const residualOf = (r: Risk) => r.residualLikelihood * r.residualImpact;
const isOpen = (r: Risk) => r.status === "Mở" || r.status === "Đang xử lý";

const FILTERS = [
  { key: "", label: "Tất cả", test: () => true },
  { key: "high", label: "Cao / Rất cao", test: (r: Risk) => scoreOf(r) >= 10 },
  { key: "open", label: "Mở / Đang xử lý", test: isOpen },
  { key: "closed", label: "Đã giảm thiểu / đóng", test: (r: Risk) => !isOpen(r) },
];

function RiskMatrix({ risks }: { risks: Risk[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-cols-[auto_repeat(5,minmax(64px,1fr))] gap-1.5 text-xs">
        <div />
        {[1, 2, 3, 4, 5].map((l) => (
          <div key={`l-${l}`} className="text-center text-[11px] text-muted-foreground font-medium">
            L{l}
          </div>
        ))}
        {[5, 4, 3, 2, 1].flatMap((impact) => [
          <div key={`i-${impact}`} className="text-[11px] text-muted-foreground font-medium flex items-center justify-end pr-2">
            I{impact}
          </div>,
          ...[1, 2, 3, 4, 5].map((likelihood) => {
            const score = likelihood * impact;
            const lv = levelOf(score);
            const n = risks.filter((r) => r.likelihood === likelihood && r.impact === impact).length;
            return (
              <div
                key={`${likelihood}-${impact}`}
                className={`rounded-md border ${lv.color} min-h-[56px] p-1.5 flex flex-col items-center justify-center text-center`}
                title={`L${likelihood} × I${impact} = ${score} (${lv.label})`}
              >
                <div className="text-[10px] opacity-70">{score}</div>
                <div className="text-base font-semibold leading-none mt-0.5">{n || ""}</div>
              </div>
            );
          }),
        ])}
        <div className="col-span-6 mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span>Trục dọc: Mức nghiêm trọng (I) · Trục ngang: Khả năng xảy ra (L)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Thấp 1–4</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" /> TB 5–9</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500" /> Cao 10–15</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500" /> Rất cao 16–25</span>
        </div>
      </div>
    </div>
  );
}

export default async function RisksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const { q = "", f = "" } = await searchParams;
  const [risks, opportunities] = await Promise.all([riskStore.list(), opportunityStore.list()]);
  risks.sort((a, b) => a.code.localeCompare(b.code, "vi", { numeric: true }));

  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const query = q.trim().toLowerCase();
  const rows = risks.filter(
    (r) => filter.test(r) && (!query || `${r.code} ${r.title} ${r.owner} ${r.category}`.toLowerCase().includes(query)),
  );
  const reviewSoon = risks
    .filter((r) => r.status !== "Đã đóng" && daysUntil(r.reviewAt) <= 30)
    .sort((a, b) => (a.reviewAt || "").localeCompare(b.reviewAt || ""))
    .slice(0, 6);

  return (
    <>
      <Header
        title="Đăng ký rủi ro & cơ hội"
        description="ISO/IEC 17025:2017 §8.5 – nhận diện, đánh giá và xử lý rủi ro cho hoạt động PTN"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Tổng rủi ro đã đăng ký", value: risks.length, icon: ListChecks, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Mức Cao / Rất cao", value: risks.filter((r) => scoreOf(r) >= 10).length, icon: AlertOctagon, accent: "bg-rose-50 text-rose-600" },
            { label: "Đang xử lý / Mở", value: risks.filter(isOpen).length, icon: TrendingUp, accent: "bg-amber-50 text-amber-600" },
            { label: "Đã giảm thiểu / đóng", value: risks.filter((r) => !isOpen(r)).length, icon: ShieldCheck, accent: "bg-blue-50 text-blue-600" },
          ]}
        />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ma trận rủi ro 5×5</CardTitle>
              <CardDescription>Phân bố rủi ro theo Khả năng × Mức nghiêm trọng – số trong ô là số lượng rủi ro</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskMatrix risks={risks} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cần xem xét trong 30 ngày</CardTitle>
              <CardDescription>Quá hạn hoặc sắp đến hạn rà soát biện pháp kiểm soát</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewSoon.length === 0 && <div className="text-sm text-muted-foreground">Không có rủi ro nào đến hạn xem xét</div>}
              <ul className="space-y-3">
                {reviewSoon.map((r) => {
                  const lv = levelOf(scoreOf(r));
                  const days = daysUntil(r.reviewAt);
                  return (
                    <li key={r.id} className="flex items-start gap-3 p-3 rounded-md border bg-card">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${lv.swatch}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-2">{r.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.code} · {r.owner}</div>
                      </div>
                      <div className={`text-xs text-right shrink-0 ${days < 0 ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
                        {fmtDateVN(r.reviewAt)}
                        {days < 0 && <div>quá {-days} ngày</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((x) => (
            <Link
              key={x.key || "all"}
              href={`/risks?${new URLSearchParams({ ...(q && { q }), ...(x.key && { f: x.key }) })}`}
              className={`h-8 px-3 inline-flex items-center rounded-full border text-xs font-medium ${
                f === x.key ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              }`}
            >
              {x.label} <span className="ml-1.5 opacity-70">{risks.filter(x.test).length}</span>
            </Link>
          ))}
          <div className="ml-auto w-full sm:w-auto">
            <EntitySearchInput basePath="/risks" placeholder="Tìm mã, tiêu đề, phụ trách…" />
          </div>
        </div>

        <CrudTableCard
          title="Danh mục rủi ro"
          description="Mỗi rủi ro gắn điều khoản ISO/IEC 17025:2017, biện pháp xử lý và mức tồn dư sau xử lý"
          endpoint="/api/risks"
          entity="risks"
          editFields={RISK_FIELDS}
          addNode={<EntityFormDialog mode="add" endpoint="/api/risks" title="Thêm rủi ro" fields={RISK_FIELDS} addLabel="Thêm rủi ro" />}
          headers={["Mã", "Rủi ro", "Phân loại", "L × I", "Xử lý / phụ trách", "Tồn dư", "Trạng thái"]}
          emptyText={query || f ? "Không có rủi ro phù hợp" : "Chưa có rủi ro nào"}
          rows={rows.map((r) => {
            const lv = levelOf(scoreOf(r));
            const rl = levelOf(residualOf(r));
            return {
              id: r.id,
              label: r.code,
              initial: r,
              cells: [
                <div key="c">
                  <div className="font-mono text-xs font-semibold">{r.code}</div>
                  {r.isoClause && <div className="text-[11px] text-muted-foreground">{r.isoClause}</div>}
                </div>,
                <div key="t" className="max-w-[300px]">
                  <div className="font-medium text-sm line-clamp-2">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.action}</div>
                </div>,
                <Badge key="k" variant="secondary" className="text-xs">{r.category}</Badge>,
                <div key="s" className="font-mono text-xs">
                  {r.likelihood} × {r.impact} = <span className="font-semibold">{scoreOf(r)}</span>
                  <div className="mt-0.5"><Badge variant={lv.variant}>{lv.label}</Badge></div>
                </div>,
                <div key="o" className="text-xs">
                  <div>{r.treatment}</div>
                  <div className="text-muted-foreground">{r.owner}</div>
                </div>,
                <div key="r" className="font-mono text-xs">
                  {r.residualLikelihood} × {r.residualImpact} = <span className="font-semibold">{residualOf(r)}</span>
                  <div className="mt-0.5"><Badge variant={rl.variant}>{rl.label}</Badge></div>
                </div>,
                <Badge key="st" variant={statusVariant[r.status] ?? "secondary"}>{r.status}</Badge>,
              ],
            };
          })}
        />

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle>Cơ hội cải tiến</CardTitle>
              </div>
              <CardDescription>ISO/IEC 17025:2017 §8.5 yêu cầu xác định cả cơ hội bên cạnh rủi ro</CardDescription>
            </div>
            <EntityFormDialog mode="add" endpoint="/api/opportunities" title="Thêm cơ hội cải tiến" fields={OPP_FIELDS} addLabel="Thêm cơ hội" />
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 && <div className="text-sm text-muted-foreground">Chưa có cơ hội cải tiến nào</div>}
            <ul className="space-y-3">
              {opportunities.map((o) => (
                <li key={o.id} className="p-3 rounded-md border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{o.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{o.description}</div>
                    </div>
                    <Badge variant={opStatusVariant[o.status] ?? "secondary"}>{o.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Lợi ích kỳ vọng:</span>
                    <span>{o.expectedBenefit || "—"}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">Phụ trách:</span>
                    <span>{o.owner || "—"}</span>
                    <span className="ml-auto flex gap-1.5">
                      <EntityFormDialog mode="edit" endpoint="/api/opportunities" id={o.id} title="Sửa cơ hội cải tiến" fields={OPP_FIELDS} initial={o} submitLabel="Lưu thay đổi" />
                      <DeleteEntityButton entity="opportunities" id={o.id} label={o.title} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
