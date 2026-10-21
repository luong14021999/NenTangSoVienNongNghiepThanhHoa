import { LineChart, CheckCircle2, AlertTriangle, CalendarClock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import { StatGrid, clip } from "@/components/qms/stat-grid";
import { curveStore, type CalibrationCurve } from "@/lib/data/calc-methods";
import { equipmentStore } from "@/lib/data/equipment";
import { parsePoints } from "@/lib/calc/text-formats";
import { testLabels } from "@/lib/accreditation";
import { daysUntil, fmtDateVN, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đường chuẩn" };

const vn = (n: number, d = 6) => (Number.isFinite(n) ? String(Number(n.toPrecision(d))).replace(".", ",") : "—");

function CurveChart({ c }: { c: CalibrationCurve }) {
  let pts: { conc: number; signal: number }[] = [];
  try {
    pts = parsePoints(c.pointsText);
  } catch {
    return null;
  }
  const W = 360, H = 180, P = { l: 44, r: 12, t: 10, b: 28 };
  const xMax = Math.max(...pts.map((p) => p.conc)) || 1;
  const yMax = Math.max(...pts.map((p) => p.signal), c.intercept + c.slope * xMax) || 1;
  const yMin = Math.min(0, ...pts.map((p) => p.signal));
  const x = (v: number) => P.l + (v / xMax) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - ((v - yMin) / (yMax - yMin || 1)) * (H - P.t - P.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Đường chuẩn ${c.code}`}>
      <line x1={P.l} y1={H - P.b} x2={W - P.r} y2={H - P.b} stroke="#cbd5e1" />
      <line x1={P.l} y1={P.t} x2={P.l} y2={H - P.b} stroke="#cbd5e1" />
      <line x1={x(0)} y1={y(c.intercept)} x2={x(xMax)} y2={y(c.intercept + c.slope * xMax)} stroke="#1d8048" strokeWidth="1.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={x(p.conc)} cy={y(p.signal)} r="3.5" fill="#2563eb" />
      ))}
      <text x={W - P.r} y={H - 8} textAnchor="end" fontSize="9" fill="#64748b">Nồng độ ({c.concUnit || "—"})</text>
      <text x={4} y={P.t + 8} fontSize="9" fill="#64748b">{c.signalUnit || "Tín hiệu"}</text>
      <text x={P.l + 4} y={P.t + 12} fontSize="10" fill="#0f172a">
        y = {vn(c.intercept, 4)} + {vn(c.slope, 5)}·x · R² = {vn(c.r2, 6)}
      </text>
    </svg>
  );
}

export default async function CalibrationCurvesPage() {
  const [curves, equipment] = await Promise.all([curveStore.list(), equipmentStore.list()]);
  curves.sort((a, b) => (b.analyzedAt || "").localeCompare(a.analyzedAt || ""));
  const FIELDS: CrudField[] = [
    { name: "code", label: "Mã đường chuẩn", required: true, mono: true, placeholder: "VD: DC-PB-2026-10-21" },
    { name: "r2Min", label: "Tiêu chí R² tối thiểu", type: "number", defaultValue: 0.995 },
    { name: "testLabel", label: "Phép thử", type: "select", options: ["", ...testLabels], full: true },
    { name: "instrumentCode", label: "Thiết bị", type: "select", options: [{ value: "", label: "—" }, ...equipment.map((e) => ({ value: e.code, label: `${e.code} · ${clip(e.name, 50)}` }))], full: true },
    { name: "analyzedAt", label: "Ngày dựng đường chuẩn", type: "date", defaultValue: todayISO() },
    { name: "validUntil", label: "Hiệu lực đến", type: "date", defaultValue: todayISO() },
    { name: "analyst", label: "Người thực hiện" },
    { name: "concUnit", label: "Đơn vị nồng độ", placeholder: "mg/L" },
    { name: "signalUnit", label: "Đơn vị tín hiệu", placeholder: "Abs" },
    { name: "pointsText", label: "Điểm chuẩn – mỗi dòng: nồng độ ; tín hiệu (dán 2 cột từ Excel được)", type: "textarea", required: true, placeholder: "0 ; 0,0021\n0,5 ; 0,0518\n1 ; 0,1034\n2 ; 0,2051\n4 ; 0,4087" },
    { name: "note", label: "Ghi chú", type: "textarea" },
  ];
  const failing = curves.filter((c) => c.r2 < c.r2Min);
  const valid = curves.filter((c) => !c.validUntil || daysUntil(c.validUntil) >= 0);

  return (
    <>
      <Header
        title="Đường chuẩn"
        description="M2.5 – hồi quy tuyến tính tính ở server: hệ số góc, hệ số chặn, R², s(y/x), LOD, LOQ; dùng để quy đổi tín hiệu → nồng độ khi nhập kết quả"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <StatGrid
          stats={[
            { label: "Đường chuẩn", value: curves.length, icon: LineChart, accent: "bg-blue-50 text-blue-600" },
            { label: "Còn hiệu lực", value: valid.length, icon: CalendarClock, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Đạt R²", value: curves.length - failing.length, icon: CheckCircle2, accent: "bg-violet-50 text-violet-600" },
            { label: "Không đạt R²", value: failing.length, icon: AlertTriangle, accent: "bg-rose-50 text-rose-600", hint: "bị chặn khi dùng" },
          ]}
        />
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle>Danh sách đường chuẩn</CardTitle>
              <CardDescription>Kết quả dùng đường chuẩn R² không đạt hoặc hết hiệu lực sẽ bị chặn theo quy tắc kiểm soát</CardDescription>
            </div>
            <EntityFormDialog mode="add" endpoint="/api/calibration-curves" title="Dựng đường chuẩn" description="Hồi quy được tính tự động khi lưu" fields={FIELDS} addLabel="Thêm đường chuẩn" />
          </CardHeader>
          <CardContent>
            {curves.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">Chưa có đường chuẩn nào</div>}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {curves.map((c) => {
                const ok = c.r2 >= c.r2Min;
                const expired = c.validUntil && daysUntil(c.validUntil) < 0;
                return (
                  <div key={c.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold">{c.code}</div>
                        <div className="text-[11px] text-muted-foreground">{c.testLabel ? clip(c.testLabel, 90) : "Chưa gắn phép thử"}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.instrumentCode || "—"} · {fmtDateVN(c.analyzedAt)} · {c.analyst || "—"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={ok ? "success" : "destructive"}>R² {ok ? "đạt" : "không đạt"}</Badge>
                        {expired ? <Badge variant="secondary">Hết hiệu lực</Badge> : c.validUntil && <span className="text-[11px] text-muted-foreground">đến {fmtDateVN(c.validUntil)}</span>}
                      </div>
                    </div>
                    <CurveChart c={c} />
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      {[
                        ["n", String(c.n)],
                        ["Hệ số góc b", vn(c.slope)],
                        ["Hệ số chặn a", vn(c.intercept)],
                        ["R² (≥ " + vn(c.r2Min, 4) + ")", vn(c.r2, 6)],
                        ["s(y/x)", vn(c.syx, 4)],
                        ["Khoảng", `${vn(c.minConc, 4)} – ${vn(c.maxConc, 4)} ${c.concUnit}`],
                        ["LOD", `${vn(c.lod, 3)} ${c.concUnit}`],
                        ["LOQ", `${vn(c.loq, 3)} ${c.concUnit}`],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded border px-2 py-1">
                          <div className="text-muted-foreground">{k}</div>
                          <div className="font-mono">{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <EntityFormDialog mode="edit" endpoint="/api/calibration-curves" id={c.id} title={`Sửa đường chuẩn ${c.code}`} fields={FIELDS} initial={c} submitLabel="Lưu & tính lại" />
                      <DeleteEntityButton entity="calibration-curves" id={c.id} label={c.code} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
