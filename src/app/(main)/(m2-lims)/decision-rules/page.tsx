import {
  Scale,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileSignature,
  Handshake,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DecisionRule } from "@/lib/mock-data";
import { LIMIT_DIRECTIONS, RULE_TYPES, decisionRuleStore } from "@/lib/modules/m2/data/quality";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { EntitySearchInput } from "@/components/crud/search-input";
import { fmtDateVN, todayISO } from "@/lib/platform/dates";

export const dynamic = "force-dynamic";

const FIELDS: CrudField[] = [
  { name: "criterion", label: "Chỉ tiêu", required: true, placeholder: "VD: Pb tổng" },
  { name: "matrix", label: "Đối tượng (matrix)", placeholder: "VD: Đất" },
  { name: "method", label: "Phương pháp", full: true, placeholder: "VD: TCVN 6496B:2009" },
  { name: "unit", label: "Đơn vị", placeholder: "mg/kg" },
  { name: "ruleType", label: "Loại quy tắc", type: "select", options: RULE_TYPES },
  { name: "limitDirection", label: "Kiểu giới hạn", type: "select", options: LIMIT_DIRECTIONS.map((d) => ({ value: d, label: d === "max" ? "Giới hạn trên (≤)" : d === "min" ? "Giới hạn dưới (≥)" : "Khoảng (min – max)" })) },
  { name: "limit", label: "Giới hạn (trên / giá trị)", type: "number", required: true },
  { name: "limitMin", label: "Giới hạn dưới (chỉ khi là khoảng)" },
  { name: "uncertainty", label: "U mở rộng (k = 2)", type: "number" },
  { name: "limitSource", label: "Nguồn giới hạn (QCVN, hợp đồng…)", full: true },
  { name: "notes", label: "Ghi chú", type: "textarea" },
  { name: "approvedBy", label: "Người phê duyệt" },
  { name: "approvedAt", label: "Ngày phê duyệt", type: "date", defaultValue: todayISO() },
];

function ruleVariant(t: DecisionRule["ruleType"]) {
  if (t === "Simple acceptance (không guard band)") return "secondary";
  if (t === "Guarded acceptance (w = U)") return "success";
  if (t === "Guarded rejection (w = U)") return "warning";
  return "outline";
}

function format(n: number, unit: string) {
  const digits = Math.abs(n) < 1 ? 3 : Math.abs(n) < 10 ? 2 : 1;
  return `${n.toFixed(digits)} ${unit}`;
}

const VIEW_W = 720;
const VIEW_H = 100;
const PAD = { left: 32, right: 32, top: 18, bottom: 32 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = 26;

function ZoneVisualization({ rule }: { rule: DecisionRule }) {
  const limit = rule.limit;
  const u = rule.uncertainty;

  if (rule.limitDirection === "range" && rule.limitMin !== undefined) {
    // 2-sided rule
    const low = rule.limitMin;
    const high = limit;
    const range = high - low;
    const xMin = low - range * 0.4;
    const xMax = high + range * 0.4;
    const xScale = (v: number) =>
      PAD.left + ((v - xMin) / (xMax - xMin)) * PLOT_W;

    const lowAccept = low + u;
    const highAccept = high - u;
    const ticks = [low - u, low, lowAccept, highAccept, high, high + u];

    return (
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Vùng quyết định cho ${rule.criterion}`}
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={xScale(low - u) - PAD.left}
          height={PLOT_H}
          fill="#fee2e2"
        />
        <rect
          x={xScale(low - u)}
          y={PAD.top}
          width={xScale(low + u) - xScale(low - u)}
          height={PLOT_H}
          fill="#fef3c7"
        />
        <rect
          x={xScale(low + u)}
          y={PAD.top}
          width={xScale(high - u) - xScale(low + u)}
          height={PLOT_H}
          fill="#d1fae5"
        />
        <rect
          x={xScale(high - u)}
          y={PAD.top}
          width={xScale(high + u) - xScale(high - u)}
          height={PLOT_H}
          fill="#fef3c7"
        />
        <rect
          x={xScale(high + u)}
          y={PAD.top}
          width={PAD.left + PLOT_W - xScale(high + u)}
          height={PLOT_H}
          fill="#fee2e2"
        />

        <line
          x1={xScale(low)}
          x2={xScale(low)}
          y1={PAD.top - 4}
          y2={PAD.top + PLOT_H + 4}
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        <line
          x1={xScale(high)}
          x2={xScale(high)}
          y1={PAD.top - 4}
          y2={PAD.top + PLOT_H + 4}
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {ticks.map((t, i) => (
          <text
            key={i}
            x={xScale(t)}
            y={PAD.top + PLOT_H + 18}
            textAnchor="middle"
            fontSize="9"
            fill="#475569"
          >
            {t.toFixed(rule.uncertainty < 0.1 ? 3 : 2)}
          </text>
        ))}
        <text
          x={xScale(low)}
          y={PAD.top - 6}
          textAnchor="middle"
          fontSize="9"
          fill="#0f172a"
          fontWeight={600}
        >
          min
        </text>
        <text
          x={xScale(high)}
          y={PAD.top - 6}
          textAnchor="middle"
          fontSize="9"
          fill="#0f172a"
          fontWeight={600}
        >
          max
        </text>
      </svg>
    );
  }

  // 1-sided max rule
  const xMin = -u * 1.5;
  const xMax = limit + 3 * u;
  const xScale = (v: number) =>
    PAD.left + ((v - xMin) / (xMax - xMin)) * PLOT_W;
  const acceptanceEnd = limit - u;
  const rejectionStart = limit + u;
  const ticks = [0, acceptanceEnd, limit, rejectionStart];

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Vùng quyết định cho ${rule.criterion}`}
    >
      <rect
        x={PAD.left}
        y={PAD.top}
        width={xScale(acceptanceEnd) - PAD.left}
        height={PLOT_H}
        fill="#d1fae5"
      />
      <rect
        x={xScale(acceptanceEnd)}
        y={PAD.top}
        width={xScale(rejectionStart) - xScale(acceptanceEnd)}
        height={PLOT_H}
        fill="#fef3c7"
      />
      <rect
        x={xScale(rejectionStart)}
        y={PAD.top}
        width={PAD.left + PLOT_W - xScale(rejectionStart)}
        height={PLOT_H}
        fill="#fee2e2"
      />

      <line
        x1={xScale(limit)}
        x2={xScale(limit)}
        y1={PAD.top - 4}
        y2={PAD.top + PLOT_H + 4}
        stroke="#0f172a"
        strokeWidth="1.5"
      />

      {ticks.map((t, i) => (
        <text
          key={i}
          x={xScale(t)}
          y={PAD.top + PLOT_H + 18}
          textAnchor="middle"
          fontSize="9"
          fill="#475569"
        >
          {t.toFixed(u < 0.1 ? 3 : 2)}
        </text>
      ))}
      <text
        x={xScale(limit)}
        y={PAD.top - 6}
        textAnchor="middle"
        fontSize="9"
        fill="#0f172a"
        fontWeight={600}
      >
        Giới hạn = {limit} {rule.unit}
      </text>

      <text
        x={(PAD.left + xScale(acceptanceEnd)) / 2}
        y={PAD.top + PLOT_H / 2 + 3}
        textAnchor="middle"
        fontSize="9"
        fill="#047857"
        fontWeight={600}
      >
        ĐẠT
      </text>
      <text
        x={(xScale(acceptanceEnd) + xScale(rejectionStart)) / 2}
        y={PAD.top + PLOT_H / 2 + 3}
        textAnchor="middle"
        fontSize="9"
        fill="#b45309"
        fontWeight={600}
      >
        VÔ ĐỊNH
      </text>
      <text
        x={(xScale(rejectionStart) + PAD.left + PLOT_W) / 2}
        y={PAD.top + PLOT_H / 2 + 3}
        textAnchor="middle"
        fontSize="9"
        fill="#b91c1c"
        fontWeight={600}
      >
        KHÔNG ĐẠT
      </text>
    </svg>
  );
}

const statsOf = (decisionRules: DecisionRule[]) => [
  {
    label: "Quy tắc đã phê duyệt",
    value: decisionRules.length,
    icon: FileSignature,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Áp dụng guard band (w = U)",
    value: decisionRules.filter((r) => r.ruleType.startsWith("Guarded")).length,
    icon: Scale,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Simple acceptance",
    value: decisionRules.filter((r) => r.ruleType.startsWith("Simple")).length,
    icon: CheckCircle2,
    accent: "bg-violet-50 text-violet-600",
  },
  {
    label: "Theo thỏa thuận KH",
    value: decisionRules.filter((r) => r.ruleType.startsWith("Theo")).length,
    icon: Handshake,
    accent: "bg-amber-50 text-amber-600",
  },
];

export default async function DecisionRulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const all = await decisionRuleStore.list();
  const query = q.trim().toLowerCase();
  const decisionRules = all.filter(
    (r) => !query || `${r.criterion} ${r.matrix} ${r.method} ${r.limitSource}`.toLowerCase().includes(query),
  );
  const stats = statsOf(all);
  return (
    <>
      <Header
        title="Quy tắc quyết định (Decision rules)"
        description="ISO/IEC 17025:2017 §7.8.6 – kết luận đạt/không đạt có tính đến độ không đảm bảo đo"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {s.label}
                  </div>
                  <div className="text-3xl font-semibold mt-1.5">{s.value}</div>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.accent}`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <CardTitle>Cách áp dụng quy tắc quyết định</CardTitle>
            </div>
            <CardDescription>
              Tham chiếu JCGM 106:2012 – Đánh giá sự phù hợp với giới hạn quy
              định
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border bg-emerald-50/50 border-emerald-200 p-3">
                <div className="flex items-center gap-2 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Vùng ĐẠT
                </div>
                <div className="mt-1 text-foreground/80">
                  Kết quả + U ≤ giới hạn → kết luận đạt với độ tin cậy 95%
                </div>
              </div>
              <div className="rounded-lg border bg-amber-50/50 border-amber-200 p-3">
                <div className="flex items-center gap-2 font-semibold text-amber-700">
                  <HelpCircle className="w-4 h-4" />
                  Vùng VÔ ĐỊNH (guarded)
                </div>
                <div className="mt-1 text-foreground/80">
                  Giới hạn − U &lt; Kết quả &lt; Giới hạn + U → không thể kết
                  luận, cần phân tích lại hoặc thoả thuận với KH
                </div>
              </div>
              <div className="rounded-lg border bg-rose-50/50 border-rose-200 p-3">
                <div className="flex items-center gap-2 font-semibold text-rose-700">
                  <XCircle className="w-4 h-4" />
                  Vùng KHÔNG ĐẠT
                </div>
                <div className="mt-1 text-foreground/80">
                  Kết quả − U &gt; giới hạn → kết luận không đạt với độ tin cậy
                  95%
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              U là độ không đảm bảo đo mở rộng (Expanded uncertainty, k = 2,
              tương đương mức tin cậy ~95%). Mặc định Viện áp{" "}
              <span className="font-medium text-foreground">
                Guarded acceptance w = U
              </span>{" "}
              cho chỉ tiêu an toàn thực phẩm; Simple acceptance cho chỉ tiêu
              định tính.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between space-y-0">
            <div>
              <CardTitle>Danh mục quy tắc quyết định</CardTitle>
              <CardDescription>
                Phê duyệt theo từng chỉ tiêu × matrix × phương pháp – ghi rõ
                trên phiếu KQ khi có kết luận đạt/không đạt
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntitySearchInput basePath="/decision-rules" placeholder="Tìm chỉ tiêu, matrix…" />
              <EntityFormDialog
                mode="add"
                endpoint="/api/decision-rules"
                title="Thêm quy tắc quyết định"
                description="Ngưỡng vùng chấp nhận / bác bỏ được tính tự động theo guard band w = U"
                fields={FIELDS}
                addLabel="Thêm quy tắc"
              />
            </div>
          </CardHeader>
          <CardContent>
            {decisionRules.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                {query ? "Không có quy tắc phù hợp" : "Chưa có quy tắc quyết định nào"}
              </div>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {decisionRules.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {r.criterion} trong {r.matrix}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.method}
                      </div>
                    </div>
                    <Badge variant={ruleVariant(r.ruleType)} className="shrink-0">
                      {r.ruleType.split(" ")[0]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <div>
                      <div className="text-muted-foreground">Giới hạn</div>
                      <div className="font-medium">
                        {r.limitDirection === "range" && r.limitMin !== undefined
                          ? `${r.limitMin} – ${r.limit} ${r.unit}`
                          : `${r.limitDirection === "min" ? "≥" : "≤"} ${r.limit} ${r.unit}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">U (k=2)</div>
                      <div className="font-medium">
                        ±{format(r.uncertainty, r.unit)}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Nguồn giới hạn</div>
                      <div className="text-foreground">{r.limitSource}</div>
                    </div>
                  </div>

                  <ZoneVisualization rule={r} />

                  <div className="text-xs text-muted-foreground">
                    {r.notes}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="text-muted-foreground">
                      Phê duyệt: <span className="text-foreground">{r.approvedBy}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground mr-1">{fmtDateVN(r.approvedAt)}</span>
                      <EntityFormDialog
                        mode="edit"
                        endpoint="/api/decision-rules"
                        id={r.id}
                        title={`Sửa quy tắc – ${r.criterion}`}
                        fields={FIELDS}
                        initial={{ ...r, limitMin: r.limitMin ?? "" }}
                        submitLabel="Lưu thay đổi"
                      />
                      <DeleteEntityButton entity="decision-rules" id={r.id} label={`${r.criterion} trong ${r.matrix}`} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
